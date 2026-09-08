import 'reflect-metadata';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { CmsService } from '../src/admin/cms.service';
import { modules } from '../src/admin/modules';
import { PublicContentController } from '../src/admin/public-content.controller';
import { seedDevelopment } from '../prisma/seed-data';

// PostgreSQL engine in memory. The pg bridge is test-only and preserves the
// driver's timestamp/JSON parsers instead of relying on the host timezone.
async function database() {
  const engine = new PGlite();
  await engine.exec(
    readFileSync(
      'prisma/migrations/202609080001_legacy_baseline/migration.sql',
      'utf8',
    ),
  );
  await engine.exec(
    `INSERT INTO "TeamMember" (id,name,role,biography,"updatedAt") VALUES ('legacy','Existing record','{}','{}',now())`,
  );
  for (const name of [
    '202609080002_normalized_platform',
    '202609080003_admin_sessions',
    '202609090001_media_variants',
  ])
    await engine.exec(
      readFileSync('prisma/migrations/' + name + '/migration.sql', 'utf8'),
    );
  const pool = new pg.Pool();
  (pool as any).query = async (config: any) => {
    const parsers = Object.fromEntries(
      [20, 1082, 1114, 1184, 114, 3802].map((oid) => [
        oid,
        config.types.getTypeParser(oid, 'text'),
      ]),
    );
    const result = await engine.query(config.text, config.values || [], {
      parsers,
    });
    return {
      rows: result.rows.map((row: any) =>
        result.fields.map((f) => row[f.name]),
      ),
      fields: result.fields,
      rowCount: result.affectedRows ?? result.rows.length,
    };
  };
  (pool as any).connect = async () => Object.assign(pool, { release() {} });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });
  return {
    db,
    engine,
    close: async () => {
      await db.$disconnect();
      await engine.close();
    },
  };
}
test('migrations preserve legacy records and DEMO seed is private and idempotent', async () => {
  const { db, close } = await database();
  try {
    assert.equal(
      (await db.teamMember.findUnique({ where: { id: 'legacy' } }))?.slug,
      'legacy-legacy',
    );
    await seedDevelopment(db);
    await seedDevelopment(db);
    assert.equal(await db.activity.count(), 1);
    assert.equal(await db.activity.count({ where: { published: true } }), 0);
    assert.equal(await db.projectPartner.count(), 0);
    assert.equal(await db.activityPartner.count(), 0);
    assert.equal(
      await db.document.count({ where: { fileId: { not: null } } }),
      0,
    );
    assert.equal(await db.user.count({ where: { active: true } }), 0);
    assert.equal(await db.contactSubmission.count(), 0);
    assert.equal(await db.newsletterSubscriber.count(), 0);
    const area = await db.strategicArea.findUniqueOrThrow({
      where: { slug: 'demo-area' },
    });
    await assert.rejects(
      db.strategicAreaTranslation.create({
        data: {
          strategicAreaId: area.id,
          locale: 'EN',
          title: 'Duplicate',
          summary: 'Test',
        },
      }),
    );
    await db.strategicArea.delete({ where: { id: area.id } });
    assert.equal(
      await db.strategicAreaTranslation.count({
        where: { strategicAreaId: area.id },
      }),
      0,
    );
  } finally {
    await close();
  }
});
test('all CMS module selectors and editable module CRUD match the real Prisma schema', async () => {
  const { db, close } = await database();
  try {
    const user = await db.user.create({
      data: {
        email: 'integration@example.invalid',
        name: 'DEMO test',
        isDemo: true,
      },
    });
    const admin = {
      id: user.id,
      name: user.name,
      email: user.email,
      permissions: ['*'],
      sessionId: 'test',
    };
    const cms = new CmsService(db as any);
    for (const [key, def] of Object.entries(modules)) {
      await cms.list(admin, key);
      await cms.choices(admin, key);
      if (def.readonly || def.noCreate) continue;
      const fields: Record<string, unknown> = {};
      for (const field of def.fields) {
        if (field.required)
          fields[field.name] =
            field.name === 'slug'
              ? key + '-integration'
              : field.type === 'select'
                ? field.options![0]
                : 'DEMO integration';
      }
      const translations = def.translations
        ? [
            {
              locale: 'EN',
              ...Object.fromEntries(
                def.translations
                  .filter((f) => f.required)
                  .map((f) => [f.name, 'DEMO integration']),
              ),
            },
          ]
        : undefined;
      const created = await cms.save(admin, key, undefined, {
        fields,
        ...(translations ? { translations } : {}),
      });
      assert(created?.id);
      const row = await cms.get(admin, key, created.id);
      await cms.save(admin, key, created.id, {
        fields,
        ...(translations ? { translations } : {}),
        version: row.updatedAt.toISOString(),
      });
      const current = await cms.get(admin, key, created.id);
      if (!def.noDelete)
        await cms.remove(
          admin,
          key,
          created.id,
          current.updatedAt.toISOString(),
        );
    }
    assert.ok((await db.adminAuditLog.count()) > 15);
  } finally {
    await close();
  }
});
test('publishing exposes only approved records and unpublishing removes public results', async () => {
  const { db, close } = await database();
  try {
    const user = await db.user.create({
      data: { email: 'publication-test@example.invalid', name: 'DEMO test' },
    });
    const admin = {
      id: user.id,
      name: user.name,
      email: user.email,
      permissions: ['*'],
      sessionId: 'test',
    };
    const cms = new CmsService(db as any),
      publicApi = new PublicContentController(db as any);
    const data = {
      fields: { slug: 'test-area', published: false },
      translations: [
        {
          locale: 'EN',
          title: 'Isolated test',
          summary: 'Not an institutional claim',
        },
      ],
    };
    const made = await cms.save(admin, 'strategic-areas', undefined, data);
    const locale = { locale: 'en', limit: 25, offset: 0 } as any;
    assert.equal((await publicApi.areas(locale)).length, 0);
    let row = await cms.get(admin, 'strategic-areas', made!.id);
    await cms.save(admin, 'strategic-areas', row.id, {
      ...data,
      fields: { ...data.fields, published: true },
      version: row.updatedAt.toISOString(),
    });
    assert.equal((await publicApi.areas(locale)).length, 1);
    row = await cms.get(admin, 'strategic-areas', row.id);
    await cms.save(admin, 'strategic-areas', row.id, {
      ...data,
      version: row.updatedAt.toISOString(),
    });
    assert.equal((await publicApi.areas(locale)).length, 0);
    assert.equal((await publicApi.content(locale)).length, 0);
    assert.equal((await publicApi.publications(locale)).length, 0);
    assert.equal((await publicApi.team(locale)).length, 0);
    assert.equal((await publicApi.partners(locale)).length, 0);
    assert.equal((await publicApi.governance(locale)).documents.length, 0);
  } finally {
    await close();
  }
});
