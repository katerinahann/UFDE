import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { modules, Field, AdminModule } from './modules';
import {
  AdminIdentity,
  hasPermission,
  requirePermission,
} from './auth.service';
const bad = (message: string): never => {
  throw new BadRequestException(message);
};
export function validateFields(fields: Field[], input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    return bad('Expected an object');
  const values = input as Record<string, unknown>,
    out: Record<string, unknown> = {};
  for (const key of Object.keys(values))
    if (!fields.some((f) => f.name === key)) bad('Unknown field: ' + key);
  for (const field of fields) {
    let value = values[field.name];
    if (value === undefined) {
      if (field.required) bad(field.label + ' is required');
      continue;
    }
    if (value === null || value === '') {
      if (field.required) bad(field.label + ' is required');
      if (
        ['select', 'boolean', 'list', 'relations', 'json'].includes(field.type)
      )
        continue;
      out[field.name] = field.name === 'timezone' ? undefined : null;
      continue;
    }
    if (field.type === 'boolean') {
      if (typeof value !== 'boolean') bad(field.label + ' must be a boolean');
    } else if (field.type === 'number') {
      if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(value) ||
        value < 0 ||
        value > 9999
      )
        bad(field.label + ' must be a nonnegative integer below 10000');
    } else if (field.type === 'list' || field.type === 'relations') {
      if (
        !Array.isArray(value) ||
        value.length > 100 ||
        value.some((v) => typeof v !== 'string' || v.length > 2000)
      )
        bad(field.label + ' must be a list');
      if (
        field.type === 'relations' &&
        new Set(value as string[]).size !== (value as string[]).length
      )
        bad('Duplicate relations');
    } else if (field.type === 'json') {
      if (typeof value !== 'object' || Array.isArray(value))
        bad('Social links must be an object');
      for (const [key, url] of Object.entries(value as object)) {
        if (
          !['linkedin', 'facebook', 'x', 'instagram', 'youtube'].includes(
            key,
          ) ||
          typeof url !== 'string' ||
          !safeUrl(url)
        )
          bad('Use configured network names and HTTPS URLs');
      }
    } else {
      if (
        typeof value !== 'string' ||
        value.length >
          (field.max || (['textarea'].includes(field.type) ? 50000 : 1000))
      )
        bad('Invalid ' + field.label);
      value = (value as string).trim();
      if (field.required && !value) bad(field.label + ' is required');
      if (field.type === 'select' && !field.options?.includes(value as string))
        bad('Invalid ' + field.label);
      if (field.type === 'url' && !safeUrl(value as string))
        bad(field.label + ' must be an HTTPS URL without credentials');
      if (
        field.type === 'email' &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)
      )
        bad('Invalid email');
      if (
        field.name === 'slug' &&
        !new RegExp(field.pattern || '^[a-z0-9]+(?:-[a-z0-9]+)*$').test(
          value as string,
        )
      )
        bad('Slug must use lowercase letters, numbers and hyphens');
      if (field.type === 'date') {
        const date = new Date(value as string);
        if (!Number.isFinite(date.getTime())) bad('Invalid date');
        value = date;
      }
    }
    out[field.name] = value;
  }
  return out;
}
function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}
@Injectable()
export class CmsService {
  constructor(private readonly db: PrismaService) {}
  definition(key: string) {
    const def = Object.hasOwn(modules, key) ? modules[key] : undefined;
    if (!def) throw new NotFoundException();
    return def;
  }
  private access(admin: AdminIdentity, key: string, action = 'read') {
    requirePermission(admin, `${key}:${action}`);
  }
  catalog(admin: AdminIdentity) {
    return Object.fromEntries(
      Object.entries(modules)
        .filter(([key]) => hasPermission(admin, `${key}:read`))
        .map(([key, { model, relations, ...def }]) => [key, def]),
    );
  }
  private select(def: AdminModule) {
    const select: Record<string, unknown> = {
      id: true,
      createdAt: true,
      updatedAt: true,
    };
    for (const f of def.fields)
      if (!def.relations?.[f.name]) select[f.name] = true;
    if (def.translations)
      select.translations = {
        select: Object.fromEntries(
          ['locale', ...def.translations.map((f) => f.name)].map((k) => [
            k,
            true,
          ]),
        ),
      };
    for (const [name, r] of Object.entries(def.relations || {}))
      select[r.relation] = {
        select: { [r.foreignKey]: true },
        ...(['authors', 'images', 'partners'].includes(r.relation)
          ? { orderBy: { sortOrder: 'asc' } }
          : {}),
      };
    if (def.model === 'media')
      Object.assign(select, {
        url: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        storageKey: true,
        width: true, height: true, purpose: true, copyrightNotice: true,
        variants: {select:{name:true,format:true,url:true,width:true,height:true,mimeType:true}},
      });
    return select;
  }
  private serialize(row: any, def: AdminModule) {
    if (!row) return row;
    for (const [name, r] of Object.entries(def.relations || {})) {
      row[name] = row[r.relation].map((j: any) => j[r.foreignKey]);
      delete row[r.relation];
    }
    if (typeof row.sizeBytes === 'bigint')
      row.sizeBytes = Number(row.sizeBytes);
    delete row.storageKey;
    return row;
  }
  async list(admin: AdminIdentity, key: string, page = 1) {
    this.access(admin, key);
    const def = this.definition(key);
    if (!Number.isInteger(page) || page < 1 || page > 10000)
      bad('Invalid page');
    const model = (this.db as any)[def.model];
    const [rows, total] = await Promise.all([
      model.findMany({
        select: this.select(def),
        take: 25,
        skip: (page - 1) * 25,
        orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
      }),
      model.count(),
    ]);
    return {
      items: rows.map((r: any) => this.serialize(r, def)),
      total,
      page,
      pageSize: 25,
    };
  }
  async get(admin: AdminIdentity, key: string, id: string) {
    this.access(admin, key);
    const def = this.definition(key);
    const row = await (this.db as any)[def.model].findUnique({
      where: { id },
      select: this.select(def),
    });
    if (!row) throw new NotFoundException();
    return this.serialize(row, def);
  }
  async choices(admin: AdminIdentity, key: string, search = '') {
    this.access(admin, key);
    const def = this.definition(key);
    if (search.length > 100) bad('Search is too long');
    const scalar = def.fields
      .filter((f) => ['slug', 'name', 'siteName'].includes(f.name))
      .map((f) => f.name);
    const localized = (def.translations || [])
      .filter((f) =>
        ['title', 'name', 'displayName', 'altText'].includes(f.name),
      )
      .map((f) => f.name);
    const clauses = [
      ...scalar.map((k) => ({
        [k]: { contains: search, mode: 'insensitive' },
      })),
      ...(localized.length
        ? [
            {
              translations: {
                some: {
                  OR: localized.map((k) => ({
                    [k]: { contains: search, mode: 'insensitive' },
                  })),
                },
              },
            },
          ]
        : []),
    ];
    const rows = await (this.db as any)[def.model].findMany({
      where: clauses.length ? { OR: clauses } : {},
      take: 40,
      select: {
        id: true,
        ...Object.fromEntries(scalar.map((k) => [k, true])),
        ...(localized.length
          ? {
              translations: {
                select: Object.fromEntries(
                  ['locale', ...localized].map((k) => [k, true]),
                ),
              },
            }
          : {}),
        ...(key === 'media' ? { filename: true, mimeType: true } : {}),
      },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r: any) => ({
      id: r.id,
      label:
        r.name ||
        r.siteName ||
        r.filename ||
        r.translations?.find((t: any) => t.locale === 'EN')?.title ||
        r.translations?.[0]?.title ||
        r.translations?.[0]?.name ||
        r.slug,
      mimeType: r.mimeType,
    }));
  }
  async seoLocales(admin: AdminIdentity, slug: string) {
    this.access(admin, 'seo');
    if (typeof slug !== 'string' || slug.length > 250) bad('Invalid route');
    return this.db.pageSEO.findMany({ where: { slug } });
  }
  async dashboard(admin: AdminIdentity) {
    const counts: Record<string, number> = {};
    for (const key of Object.keys(this.catalog(admin)))
      counts[key] = await (this.db as any)[modules[key].model].count();
    return { counts };
  }
  async save(
    admin: AdminIdentity,
    key: string,
    id: string | undefined,
    input: unknown,
  ) {
    this.access(admin, key, 'write');
    const def = this.definition(key);
    if (def.readonly || (!id && def.noCreate)) throw new ForbiddenException();
    if (!input || typeof input !== 'object' || Array.isArray(input))
      bad('Invalid payload');
    const payload = input as Record<string, unknown>;
    if (
      Object.keys(payload).some(
        (k) => !['fields', 'translations', 'version'].includes(k),
      )
    )
      bad('Unknown payload field');
    const data = validateFields(def.fields, payload.fields);
    const translations: Record<string, unknown>[] = [];
    if (def.translations) {
      if (
        !Array.isArray(payload.translations) ||
        payload.translations.length > 3
      )
        bad('Translations must be an array of EN/FR/UK entries');
      const seen = new Set();
      for (const t of payload.translations as Record<string, unknown>[]) {
        if (
          !t ||
          !['EN', 'FR', 'UK'].includes(t.locale as string) ||
          seen.has(t.locale)
        )
          bad('Invalid or duplicate translation locale');
        seen.add(t.locale);
        const { locale, ...fields } = t;
        translations.push({
          locale,
          ...validateFields(def.translations, fields),
        });
      }
      if (!translations.length) bad('Add at least one translation');
    } else if (payload.translations !== undefined)
      bad('This record has no translation rows');
    if (data.published === true) {
      this.access(admin, key, 'publish');
      if (data.isDemo === true) bad('DEMO content cannot be published');
      if (key === 'publications' && data.status !== 'PUBLISHED')
        bad('Only Published publications can appear publicly');
      if (!data.publishedAt) data.publishedAt = new Date();
    }
    if (key === 'media' && data.visibility === 'PUBLIC') {
      this.access(admin, key, 'publish');
      if (data.isDemo) bad('DEMO media must remain private');
    }
    if (key === 'subscribers' && data.status === 'UNSUBSCRIBED')
      data.unsubscribedAt = new Date();
    if (def.singleton && !id) id = 'site';
    try {
      return await this.db.$transaction(async (tx: any) => {
        const current = id
          ? await tx[def.model].findUnique({ where: { id } })
          : null;
        if (id && !current && !def.singleton) throw new NotFoundException();
        if (
          current &&
          (typeof payload.version !== 'string' ||
            new Date(payload.version).getTime() !== current.updatedAt.getTime())
        )
          throw new ConflictException(
            'This record changed. Reload before saving.',
          );
        if (
          current &&
          data.published !== undefined &&
          data.published !== current.published
        )
          this.access(admin, key, 'publish');
        if (key !== 'settings' && current?.isDemo && data.isDemo === false)
          bad('Create a real record instead of converting a DEMO fixture');
        if (
          key === 'subscribers' &&
          current &&
          (data.email !== current.email || data.language !== current.language)
        )
          bad('Subscriber identity and consent language cannot be changed');
        if (key === 'subscribers' && data.status === 'UNSUBSCRIBED') {
          data.unsubscribedAt = current?.unsubscribedAt || data.unsubscribedAt;
          data.confirmationTokenHash = null;
          data.confirmationExpiresAt = null;
        }
        const effective = { ...current, ...data };
        if (effective.published && effective.isDemo)
          bad('DEMO content cannot be published');
        if (
          key === 'publications' &&
          effective.published &&
          effective.status !== 'PUBLISHED'
        )
          bad('Published records require PUBLISHED status');
        for (const [start, end] of [
          ['startsAt', 'endsAt'],
          ['startDate', 'endDate'],
        ])
          if (
            effective[start] &&
            effective[end] &&
            new Date(effective[end]) < new Date(effective[start])
          )
            bad('End date cannot precede start date');
        if (
          key === 'documents' &&
          effective.status === 'AVAILABLE' &&
          !effective.fileId &&
          !translations.some((t) => t.fileId)
        )
          bad('Available documents need an uploaded PDF');
        if (key === 'partners' && effective.published && !effective.logoId)
          bad('Published partners need an uploaded logo');
        if (
          key === 'publications' &&
          effective.published &&
          (!(data.authorIds as string[] | undefined)?.length ||
            (!effective.year && !effective.publishedAt))
        )
          bad('Published publications need authors and a date');
        // Validate all references server-side, including media purpose and public visibility.
        for (const [fields, values] of [
          [def.fields, data],
          ...[...translations].map((t) => [def.translations!, t]),
        ] as [Field[], Record<string, unknown>][]) {
          for (const field of fields) {
            if (!field.target || !values[field.name]) continue;
            const ids = Array.isArray(values[field.name])
              ? (values[field.name] as string[])
              : [values[field.name] as string];
            const target = modules[field.target];
            const related = await tx[target.model].findMany({
              where: { id: { in: ids } },
            });
            if (related.length !== ids.length)
              bad('A selected ' + field.label + ' no longer exists');
            for (const r of related) {
              if (effective.published && r.isDemo)
                bad('Published records cannot reference DEMO content');
              if (field.target === 'media') {
                if (!r.storageKey) bad('Choose an administrator-uploaded file');
                if (field.accept === 'pdf' && r.mimeType !== 'application/pdf')
                  bad('Choose a PDF');
                if (
                  (field.accept === 'image' || field.name === 'imageIds') &&
                  !r.mimeType.startsWith('image/')
                )
                  bad('Choose an image');
                if (effective.published && r.visibility !== 'PUBLIC')
                  bad(
                    'Publish the selected media before publishing this record',
                  );
              }
            }
          }
        }
        const joins: Record<string, unknown> = {};
        for (const [name, r] of Object.entries(def.relations || {})) {
          if (data[name] !== undefined) {
            joins[r.relation] = {
              ...(current ? { deleteMany: {} } : {}),
              create: (data[name] as string[]).map((foreignId, index) => ({
                [r.foreignKey]: foreignId,
                ...r.extra,
                ...(['authors', 'images', 'partners'].includes(r.relation)
                  ? { sortOrder: index }
                  : {}),
              })),
            };
            delete data[name];
          }
        }
        let record;
        if (current) {
          const updated = await tx[def.model].updateMany({
            where: { id: current.id, updatedAt: current.updatedAt },
            data,
          });
          if (updated.count !== 1)
            throw new ConflictException(
              'Record changed. Reload before saving.',
            );
          record = await tx[def.model].update({
            where: { id: current.id },
            data: {
              ...joins,
              ...(def.translations
                ? { translations: { deleteMany: {}, create: translations } }
                : {}),
            },
          });
        } else {
          record = await tx[def.model].create({
            data: {
              ...data,
              ...(def.singleton ? { id: 'site' } : {}),
              ...joins,
              ...(def.translations
                ? { translations: { create: translations } }
                : {}),
            },
          });
        }
        await tx.adminAuditLog.create({
          data: {
            userId: admin.id,
            module: key,
            action: current ? 'update' : 'create',
            recordId: record.id,
          },
        });
        return { id: record.id };
      });
    } catch (error) {
      this.rethrow(error);
    }
  }
  async remove(admin: AdminIdentity, key: string, id: string, version: string) {
    this.access(admin, key, 'delete');
    const def = this.definition(key);
    if (def.noDelete) throw new ForbiddenException();
    try {
      return await this.db.$transaction(async (tx: any) => {
        const current = await tx[def.model].findUnique({ where: { id } });
        if (!current) throw new NotFoundException();
        if (current.published) this.access(admin, key, 'publish');
        if (
          typeof version !== 'string' ||
          new Date(version).getTime() !== current.updatedAt.getTime()
        )
          throw new ConflictException(
            'Record changed. Reload before deleting.',
          );
        const deleted = await tx[def.model].deleteMany({
          where: { id, updatedAt: current.updatedAt },
        });
        if (deleted.count !== 1) throw new ConflictException('Record changed.');
        await tx.adminAuditLog.create({
          data: {
            userId: admin.id,
            module: key,
            action: 'delete',
            recordId: id,
          },
        });
        return { deleted: true };
      });
    } catch (error) {
      this.rethrow(error);
    }
  }
  private rethrow(error: unknown): never {
    const code = (error as { code?: string }).code;
    if (code === 'P2002')
      throw new ConflictException('This slug or unique value already exists');
    if (code === 'P2003')
      throw new ConflictException(
        'This record is referenced elsewhere. Remove those links first.',
      );
    if (code === 'P2025') throw new NotFoundException();
    throw error;
  }
}
