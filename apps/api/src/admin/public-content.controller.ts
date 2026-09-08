import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ListQuery } from '../dto';
import { defaultGovernance } from '../../../../packages/config/src/governance';
const visible = () => ({
  published: true,
  isDemo: false,
  OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
});
const language = (q: ListQuery) => q.locale.toUpperCase() as 'EN' | 'FR' | 'UK';
const local = (row: any, locale: string) =>
  row?.translations?.find((t: any) => t.locale === locale) || null;
const labels: Record<string, string> = {
  INSTITUTIONAL: 'Institutional Partner',
  ACADEMIC: 'Academic Partner',
  RESEARCH: 'Research Partner',
  PUBLIC_AUTHORITY: 'Public Authority',
  INTERNATIONAL_ORGANISATION: 'International Organisation',
  LOCAL_AUTHORITY: 'Local Authority',
  STRATEGIC: 'Strategic Partner',
  SCIENTIFIC_JOURNAL: 'Scientific Journal',
  RESEARCH_REPORT: 'Research Reports',
  POLICY_BRIEF: 'Policy Briefs',
  WORKING_PAPER: 'Working Papers',
  ARTICLE_INSIGHT: 'Articles & Insights',
};
function image(media: any, locale: string, alt?: string) {
  if (
    !media ||
    media.visibility !== 'PUBLIC' ||
    media.isDemo ||
    !media.mimeType.startsWith('image/')
  )
    return undefined;
  return { url: media.url, alt: alt || local(media, locale)?.altText || '', width:media.width,height:media.height,caption:local(media,locale)?.caption,credit:media.credit,copyrightNotice:media.copyrightNotice,variants:(media.variants||[]).map((v:any)=>({name:v.name,format:v.format,url:v.url,width:v.width,height:v.height})) };
}
function pdf(media: any) {
  return media?.visibility === 'PUBLIC' &&
    !media.isDemo &&
    media.mimeType === 'application/pdf'
    ? media.url
    : undefined;
}
const mediaInclude = { include: { translations: true, variants: true } };
const partnerInclude = { translations: true, logo: mediaInclude };
function partner(row: any, locale: string) {
  const t = local(row, locale);
  return {
    id: row.id,
    slug: row.slug,
    name: t?.displayName || row.name,
    description: t?.description || '',
    logo: image(row.logo, locale, t?.logoAlt),
    website: row.website || undefined,
    country: row.countryCode || '',
    partnerType: labels[row.partnerType],
    featured: row.featured,
    sortOrder: row.sortOrder,
    published: true,
  };
}
function isVisible(row: any) {
  return (
    row?.published === true &&
    !row.isDemo &&
    (!row.publishedAt || new Date(row.publishedAt) <= new Date())
  );
}
@Controller('cms-public')
export class PublicContentController {
  constructor(private readonly db: PrismaService) {}
  private include = {
    translations: true,
    cover: mediaInclude,
    category: { include: { translations: true } },
  };
  private record(row: any, kind: string, locale: string) {
    const t = local(row, locale);
    return {
      id: row.id,
      slug: row.slug,
      kind,
      locale: locale.toLowerCase(),
      title: t.title,
      summary: t.summary,
      body: t.body || t.background || '',
      category: local(row.category, locale)?.name || '',
      isDemo: false,
      publishedAt: row.publishedAt,
      image: image(row.cover, locale, t.coverAlt),
      startDate: row.startDate || row.startsAt,
      endDate: row.endDate || row.endsAt,
    };
  }
  @Get('content') async content(@Query() q: ListQuery) {
    const locale = language(q),
      result: any[] = [];
    for (const [kind, model] of [
      ['ACTIVITY', 'activity'],
      ['PROJECT', 'project'],
    ]) {
      if (q.kind && q.kind !== kind) continue;
      const rows = await (this.db as any)[model].findMany({
        where: { ...visible(), translations: { some: { locale } } },
        include: this.include,
        take: q.limit + q.offset,
        orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
      });
      result.push(...rows.map((r: any) => this.record(r, kind, locale)));
    }
    return result
      .sort(
        (a, b) =>
          String(b.publishedAt || '').localeCompare(
            String(a.publishedAt || ''),
          ) || a.id.localeCompare(b.id),
      )
      .slice(q.offset, q.offset + q.limit);
  }
  @Get('content/:slug') async contentItem(
    @Param('slug') slug: string,
    @Query() q: ListQuery,
  ) {
    const locale = language(q);
    for (const [kind, model] of [
      ['ACTIVITY', 'activity'],
      ['PROJECT', 'project'],
    ]) {
      if (q.kind && q.kind !== kind) continue;
      const row = await (this.db as any)[model].findFirst({
        where: { slug, ...visible(), translations: { some: { locale } } },
        include: this.include,
      });
      if (row) return this.record(row, kind, locale);
    }
    throw new NotFoundException();
  }
  @Get('activity-details/:slug') async activity(
    @Param('slug') slug: string,
    @Query() q: ListQuery,
  ) {
    const locale = language(q),
      row = await this.db.activity.findFirst({
        where: { slug, ...visible(), translations: { some: { locale } } },
        include: {
          translations: true,
          images: {
            include: { media: mediaInclude },
            orderBy: { sortOrder: 'asc' },
          },
          partners: {
            where: { approved: true, partner: visible() },
            include: { partner: { include: partnerInclude } },
            orderBy: { sortOrder: 'asc' },
          },
          documents: {
            include: {
              document: {
                include: {
                  file: true,
                  translations: { include: { file: true } },
                },
              },
            },
          },
        },
      });
    if (!row) throw new NotFoundException();
    const programme = row.documents.find(
      (d) => isVisible(d.document) && d.document.public,
    );
    return {
      date: row.startsAt,
      location: local(row, locale)?.location,
      eventUrl: row.eventUrl,
      gallery: row.images.map((i) => image(i.media, locale)).filter(Boolean),
      partners: row.partners
        .map((p) => partner(p.partner, locale))
        .filter((p) => p.logo),
      programmeUrl: programme
        ? pdf(
            local(programme.document, locale)?.file || programme.document.file,
          )
        : undefined,
    };
  }
  @Get('project-details/:slug') async project(
    @Param('slug') slug: string,
    @Query() q: ListQuery,
  ) {
    const locale = language(q),
      row = await this.db.project.findFirst({
        where: { slug, ...visible(), translations: { some: { locale } } },
        include: {
          translations: true,
          category: true,
          strategicArea: { include: { translations: true } },
          lead: true,
          partners: {
            where: { approved: true, partner: visible() },
            include: { partner: { include: partnerInclude } },
            orderBy: { sortOrder: 'asc' },
          },
          activities: { include: { activity: true } },
          documents: {
            include: {
              document: {
                include: {
                  file: true,
                  translations: { include: { file: true } },
                },
              },
            },
          },
        },
      });
    if (!row) throw new NotFoundException();
    const t = local(row, locale);
    return {
      status: row.status[0] + row.status.slice(1).toLowerCase(),
      category: row.category?.slug,
      startDate: row.startDate,
      endDate: row.endDate,
      institutionType: t.institutionType,
      strategicArea: local(row.strategicArea, locale)?.title,
      lead: row.lead && isVisible(row.lead) ? row.lead.name : undefined,
      countries: row.countries,
      partners: row.partners
        .map((p) => partner(p.partner, locale))
        .filter((p) => p.logo),
      background: t.background,
      objectives: t.objectives,
      activities: t.activities,
      outcomes: t.outcomes,
      resources: row.documents
        .filter((d) => isVisible(d.document) && d.document.public)
        .map((d) => ({
          title: local(d.document, locale)?.title || '',
          url: pdf(local(d.document, locale)?.file || d.document.file),
          format: 'PDF',
        }))
        .filter((d) => d.url),
      relatedActivitySlugs: row.activities
        .filter((a) => isVisible(a.activity))
        .map((a) => a.activity.slug),
      contactEmail: row.contactEmail,
      featured: row.featured,
    };
  }
  private publicationInclude = {
    translations: true,
    cover: mediaInclude,
    pdf: true,
    authors: {
      include: { author: true },
      orderBy: { sortOrder: 'asc' as const },
    },
  };
  private publication(row: any, locale: string) {
    const t = local(row, locale);
    return {
      title: t.title,
      slug: row.slug,
      type: labels[row.type],
      coverImage: image(row.cover, locale, t.coverAlt),
      summary: t.summary,
      abstract: t.abstract,
      executiveSummary: t.executiveSummary,
      authors: row.authors
        .filter((a: any) => !a.author.isDemo)
        .map((a: any) => a.author.name),
      publishedAt: row.publishedAt,
      year: row.year,
      language: row.language,
      pdfUrl: pdf(row.pdf),
      externalUrl: row.externalUrl,
      doi: row.doi,
      isbn: row.isbn,
      citation: t.citation,
      featured: row.featured,
      status: 'Published',
      isDemo: false,
    };
  }
  @Get('publications') async publications(@Query() q: ListQuery) {
    const locale = language(q);
    const rows = await this.db.publication.findMany({
      where: {
        ...visible(),
        status: 'PUBLISHED',
        translations: { some: { locale } },
      },
      include: this.publicationInclude,
      take: q.limit,
      skip: q.offset,
      orderBy: [{ publishedAt: 'desc' }, { id: 'asc' }],
    });
    return rows.map((r) => this.publication(r, locale));
  }
  @Get('publications/:slug') async publicationItem(
    @Param('slug') slug: string,
    @Query() q: ListQuery,
  ) {
    const locale = language(q);
    const row = await this.db.publication.findFirst({
      where: {
        slug,
        ...visible(),
        status: 'PUBLISHED',
        translations: { some: { locale } },
      },
      include: this.publicationInclude,
    });
    if (!row) throw new NotFoundException();
    return this.publication(row, locale);
  }
  @Get('team') async team(@Query() q: ListQuery) {
    const locale = language(q);
    const rows = await this.db.teamMember.findMany({
      where: {
        ...visible(),
        category: { not: null },
        translations: { some: { locale } },
      },
      include: {
        translations: true,
        portrait: mediaInclude,
        expertise: {
          include: { expertise: { include: { translations: true } } },
        },
      },
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      take: q.limit,
      skip: q.offset,
    });
    return rows.map((r) => {
      const t = local(r, locale),
        photo = image(r.portrait, locale, t.portraitAlt);
      return {
        id: r.id,
        name: t.displayName || r.name,
        role: t.role,
        biography: t.biography,
        category: r.category === 'ADVISORY' ? 'advisory' : 'leadership',
        photoUrl: photo?.url,
        photoAlt: photo?.alt,
        expertise: r.expertise
          .filter((e) => !e.expertise.isDemo)
          .map((e) => local(e.expertise, locale)?.name)
          .filter(Boolean),
        institutionRole: t.institutionRole,
        email: r.email,
        linkedin: r.linkedin,
        orcid: r.orcid,
        googleScholar: r.googleScholar,
        institutionalProfile: r.institutionalProfile,
      };
    });
  }
  @Get('partners') async partners(@Query() q: ListQuery) {
    return (
      await this.db.partner.findMany({
        where: visible(),
        include: partnerInclude,
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      })
    )
      .map((r) => partner(r, language(q)))
      .filter((p) => p.logo);
  }
  @Get('settings') async settings(@Query() q: ListQuery) {
    const row = await this.db.siteSettings.findUnique({
      where: { id: 'site' },
      include: { translations: true },
    });
    const profile = (
      await this.db.siteSetting.findUnique({ where: { key: 'aboutProfile' } })
    )?.value;
    const names: Record<string, string> = {
      OUR_PARTNERS: 'Our Partners',
      INSTITUTIONAL_PARTNERS: 'Institutional Partners',
      SELECTED_PARTNERS: 'Selected Partners',
      COLLABORATING_INSTITUTIONS: 'Collaborating Institutions',
    };
    const networks: Record<string, string> = {
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      x: 'X',
      instagram: 'Instagram',
      youtube: 'YouTube',
    };
    if (!row || row.isDemo)
      return {
        socialLinks: [],
        partnerPresentation: { label: 'Our Partners' },
        aboutProfile: profile || null,
      };
    const t = local(row, language(q));
    return {
      siteName: t?.organisationName || row.siteName,
      address: t?.addressText || row.registeredOffice,
      email: row.contactEmail,
      phone: row.contactPhone,
      footerText: t?.footerText,
      partnerPresentation: { label: names[row.partnerLabel] },
      socialLinks: Object.entries(
        row.socialLinks as Record<string, string>,
      ).map(([network, url]) => ({ network: networks[network], url })),
      aboutProfile: profile || null,
    };
  }
  @Get('governance') async governance(@Query() q: ListQuery) {
    const locale = language(q),
      base = defaultGovernance(q.locale as 'en' | 'fr' | 'uk'),
      settings = await this.db.siteSettings.findUnique({
        where: { id: 'site' },
      });
    const rows = await this.db.document.findMany({
      where: {
        ...visible(),
        public: true,
        status: { in: ['AVAILABLE', 'COMING_SOON'] },
        translations: { some: { locale } },
      },
      include: { file: true, translations: { include: { file: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    const actual = settings && !settings.isDemo ? settings : null;
    return {
      ...base,
      founded: actual?.foundedYear ? String(actual.foundedYear) : '',
      organisationType: actual?.legalForm || '',
      registeredOffice: actual?.registeredOffice || '',
      legal: {
        officialName: actual?.legalName || '',
        legalForm: actual?.legalForm || '',
        registeredOffice: actual?.registeredOffice || '',
        registrationNumber: actual?.registrationNumber || '',
        registrationDate:
          actual?.registrationDate?.toISOString().slice(0, 10) || '',
        officialPublication: actual?.officialPublicationUrl || '',
        sirenSiret: [actual?.siren, actual?.siret].filter(Boolean).join(' / '),
      },
      contactEmail: actual?.contactEmail || base.contactEmail,
      documents: rows.map((r) => {
        const t = local(r, locale);
        return {
          id: r.id,
          title: t.title,
          description: t.description || '',
          type: r.type,
          publicationDate: r.publicationDate?.toISOString(),
          language: r.language,
          fileUrl: r.status === 'AVAILABLE' ? pdf(t.file || r.file) : undefined,
          public: true,
          sortOrder: r.sortOrder,
        };
      }),
    };
  }
  @Get('pages/:slug') async page(
    @Param('slug') slug: string,
    @Query() q: ListQuery,
  ) {
    const row = await this.db.page.findUnique({
      where: { slug_locale: { slug, locale: q.locale } },
    });
    if (!row?.approved) throw new NotFoundException();
    return row;
  }
  @Get('strategic-areas') async areas(@Query() q: ListQuery) {
    const locale = language(q);
    return (
      await this.db.strategicArea.findMany({
        where: { ...visible(), translations: { some: { locale } } },
        include: { translations: true },
        orderBy: { sortOrder: 'asc' },
      })
    ).map((r) => ({ slug: r.slug, iconKey: r.iconKey, ...local(r, locale) }));
  }
  @Get('seo/:slug') async seo(
    @Param('slug') slug: string,
    @Query() q: ListQuery,
  ) {
    const row = await this.db.pageSEO.findUnique({
      where: { slug_locale: { slug, locale: language(q) } },
      include: { openGraphImage: mediaInclude },
    });
    if (!row) throw new NotFoundException();
    return {
      title: row.title,
      description: row.description,
      canonicalUrl: row.canonicalUrl,
      noIndex: row.noIndex,
      image: image(row.openGraphImage, language(q)),
    };
  }
}
