export type Field = {
  name: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'email'
    | 'url'
    | 'number'
    | 'boolean'
    | 'date'
    | 'select'
    | 'list'
    | 'relation'
    | 'relations'
    | 'json';
  required?: boolean;
  options?: string[];
  target?: string;
  max?: number;
  accept?: 'image' | 'pdf';
  pattern?: string;
};
export type AdminModule = {
  label: string;
  model: string;
  fields: Field[];
  translations?: Field[];
  relations?: Record<
    string,
    { relation: string; foreignKey: string; extra?: Record<string, unknown> }
  >;
  readonly?: boolean;
  singleton?: boolean;
  noCreate?: boolean;
  noDelete?: boolean;
  private?: boolean;
};
const f = (
  name: string,
  label: string,
  type: Field['type'] = 'text',
  extra: Partial<Field> = {},
): Field => ({ name, label, type, ...extra });
const slug = f('slug', 'Slug', 'text', { required: true, max: 120 });
const title = f('title', 'Title', 'text', { required: true, max: 250 });
const summary = f('summary', 'Summary', 'textarea', {
  required: true,
  max: 3000,
});
const visibility = [
  f('published', 'Published', 'boolean'),
  f('publishedAt', 'Publication date', 'date'),
  f('isDemo', 'DEMO placeholder', 'boolean'),
];
const sort = f('sortOrder', 'Display order', 'number');
const media = (
  name: string,
  label: string,
  accept: 'image' | 'pdf' = 'image',
) => f(name, label, 'relation', { target: 'media', accept });
const relation = (
  name: string,
  label: string,
  target: string,
  multiple = false,
) => f(name, label, multiple ? 'relations' : 'relation', { target });
const category = (target: string) => relation('categoryId', 'Category', target);
const area = relation('strategicAreaId', 'Strategic area', 'strategic-areas');
const detail = [
  title,
  summary,
  f('body', 'Main content', 'textarea', { required: true, max: 50000 }),
];
export const modules: Record<string, AdminModule> = {
  activities: {
    label: 'Activities',
    model: 'activity',
    fields: [
      slug,
      category('activity-categories'),
      area,
      media('coverId', 'Cover image'),
      f('startsAt', 'Start date', 'date'),
      f('endsAt', 'End date', 'date'),
      f('timezone', 'Timezone'),
      f('countryCode', 'Country code'),
      f('eventUrl', 'Event / registration URL', 'url'),
      f('featured', 'Featured', 'boolean'),
      ...visibility,
      relation('imageIds', 'Gallery images', 'media', true),
      relation('partnerIds', 'Approved partner associations', 'partners', true),
    ],
    translations: [
      ...detail,
      f('location', 'Location'),
      f('coverAlt', 'Cover alt text'),
    ],
    relations: {
      imageIds: { relation: 'images', foreignKey: 'mediaId' },
      partnerIds: {
        relation: 'partners',
        foreignKey: 'partnerId',
        extra: { approved: true },
      },
    },
  },
  projects: {
    label: 'Projects',
    model: 'project',
    fields: [
      slug,
      f('status', 'Status', 'select', {
        options: ['PLANNED', 'UPCOMING', 'ONGOING', 'COMPLETED'],
        required: true,
      }),
      category('project-categories'),
      area,
      media('coverId', 'Cover image'),
      f('startDate', 'Start date', 'date'),
      f('endDate', 'End date', 'date'),
      f('countries', 'Country codes', 'list'),
      f('contactEmail', 'Contact email', 'email'),
      relation('leadId', 'Project lead', 'team'),
      f('featured', 'Featured', 'boolean'),
      sort,
      ...visibility,
      relation('partnerIds', 'Approved partner associations', 'partners', true),
      relation('activityIds', 'Related activities', 'activities', true),
      relation('documentIds', 'Documents', 'documents', true),
      relation('publicationIds', 'Publications', 'publications', true),
    ],
    translations: [
      title,
      summary,
      f('background', 'Background', 'textarea'),
      f('objectives', 'Objectives (one per line)', 'list'),
      f('activities', 'Activities (one per line)', 'list'),
      f('outcomes', 'Outcomes / results (one per line)', 'list'),
      f('institutionType', 'Institution type'),
      f('coverAlt', 'Cover alt text'),
    ],
    relations: {
      partnerIds: {
        relation: 'partners',
        foreignKey: 'partnerId',
        extra: { approved: true },
      },
      activityIds: { relation: 'activities', foreignKey: 'activityId' },
      documentIds: { relation: 'documents', foreignKey: 'documentId' },
      publicationIds: { relation: 'publications', foreignKey: 'publicationId' },
    },
  },
  publications: {
    label: 'Publications',
    model: 'publication',
    fields: [
      slug,
      f('type', 'Publication type', 'select', {
        required: true,
        options: [
          'SCIENTIFIC_JOURNAL',
          'RESEARCH_REPORT',
          'POLICY_BRIEF',
          'WORKING_PAPER',
          'ARTICLE_INSIGHT',
        ],
      }),
      f('status', 'Publication status', 'select', {
        required: true,
        options: ['DRAFT', 'FORTHCOMING', 'PUBLISHED'],
      }),
      f('language', 'File language', 'select', { options: ['EN', 'FR', 'UK'] }),
      f('year', 'Year', 'number'),
      f('doi', 'DOI'),
      f('isbn', 'ISBN'),
      f('externalUrl', 'Online publication URL', 'url'),
      media('coverId', 'Cover image'),
      media('pdfId', 'Publication PDF', 'pdf'),
      area,
      f('featured', 'Featured', 'boolean'),
      ...visibility,
      relation('authorIds', 'Authors (selection order)', 'authors', true),
    ],
    translations: [
      title,
      summary,
      f('abstract', 'Abstract', 'textarea', { required: true }),
      f('executiveSummary', 'Executive summary', 'textarea'),
      f('citation', 'Suggested citation', 'textarea'),
      f('coverAlt', 'Cover alt text'),
    ],
    relations: { authorIds: { relation: 'authors', foreignKey: 'authorId' } },
  },
  authors: {
    label: 'Publication Authors',
    model: 'publicationAuthor',
    fields: [
      slug,
      f('name', 'Full name', 'text', { required: true }),
      f('orcid', 'ORCID'),
      f('institutionalProfile', 'Institutional profile', 'url'),
      f('affiliation', 'Affiliation'),
      f('isDemo', 'DEMO placeholder', 'boolean'),
    ],
  },
  team: {
    label: 'Team',
    model: 'teamMember',
    fields: [
      slug,
      f('name', 'Full name', 'text', { required: true }),
      f('category', 'Team category', 'select', {
        options: ['LEADERSHIP', 'ADVISORY'],
      }),
      media('portraitId', 'Portrait'),
      f('email', 'Email', 'email'),
      f('linkedin', 'LinkedIn', 'url'),
      f('orcid', 'ORCID profile', 'url'),
      f('googleScholar', 'Google Scholar', 'url'),
      f('institutionalProfile', 'Institutional profile', 'url'),
      f('order', 'Display order', 'number'),
      ...visibility,
      relation('expertiseIds', 'Expertise', 'expertise', true),
    ],
    translations: [
      f('displayName', 'Display name'),
      f('role', 'Position', 'text', { required: true }),
      f('biography', 'Biography', 'textarea', { required: true }),
      f('institutionRole', 'Institution role'),
      f('portraitAlt', 'Portrait alt text'),
    ],
    relations: {
      expertiseIds: { relation: 'expertise', foreignKey: 'expertiseId' },
    },
  },
  partners: {
    label: 'Partners',
    model: 'partner',
    fields: [
      slug,
      f('name', 'Organisation name', 'text', { required: true }),
      f('partnerType', 'Partner category', 'select', {
        options: [
          'INSTITUTIONAL',
          'ACADEMIC',
          'RESEARCH',
          'PUBLIC_AUTHORITY',
          'INTERNATIONAL_ORGANISATION',
          'LOCAL_AUTHORITY',
          'STRATEGIC',
        ],
      }),
      media('logoId', 'Admin-uploaded logo'),
      f('website', 'Website', 'url'),
      f('countryCode', 'Country code'),
      f('featured', 'Featured', 'boolean'),
      sort,
      ...visibility,
    ],
    translations: [
      f('displayName', 'Display name'),
      f('description', 'Description', 'textarea'),
      f('logoAlt', 'Logo alt text'),
    ],
  },
  documents: {
    label: 'Governance Documents',
    model: 'document',
    fields: [
      slug,
      f('type', 'Document type', 'text', { required: true }),
      f('status', 'Document status', 'select', {
        options: ['DRAFT', 'COMING_SOON', 'AVAILABLE'],
      }),
      f('language', 'Document language', 'select', {
        options: ['EN', 'FR', 'UK'],
      }),
      media('fileId', 'PDF file', 'pdf'),
      f('publicationDate', 'Document date', 'date'),
      f('public', 'Public visibility', 'boolean'),
      sort,
      ...visibility,
    ],
    translations: [
      title,
      f('description', 'Description', 'textarea'),
      media('fileId', 'Translated PDF (optional)', 'pdf'),
    ],
  },
  'strategic-areas': {
    label: 'Strategic Areas',
    model: 'strategicArea',
    fields: [slug, f('iconKey', 'Line icon key'), sort, ...visibility],
    translations: [title, summary, f('body', 'Content', 'textarea')],
  },
  'activity-categories': {
    label: 'Activity Categories',
    model: 'activityCategory',
    fields: [slug, sort, ...visibility],
    translations: [
      f('name', 'Category name', 'text', { required: true }),
      f('description', 'Description', 'textarea'),
    ],
  },
  'project-categories': {
    label: 'Project Categories',
    model: 'projectCategory',
    fields: [slug, sort, ...visibility],
    translations: [
      f('name', 'Category name', 'text', { required: true }),
      f('description', 'Description', 'textarea'),
    ],
  },
  expertise: {
    label: 'Expertise',
    model: 'expertise',
    fields: [slug, f('isDemo', 'DEMO placeholder', 'boolean')],
    translations: [f('name', 'Expertise', 'text', { required: true })],
  },
  contacts: {
    label: 'Contact Submissions',
    model: 'contactSubmission',
    private: true,
    readonly: true,
    fields: [
      f('name', 'Name'),
      f('email', 'Email'),
      f('organization', 'Organisation'),
      f('subject', 'Subject'),
      f('message', 'Message', 'textarea'),
      f('locale', 'Language'),
      f('consentVersion', 'Privacy notice version'),
    ],
  },
  subscribers: {
    label: 'Newsletter Subscribers',
    model: 'newsletterSubscriber',
    private: true,
    noCreate: true,
    fields: [
      f('email', 'Email', 'email', { required: true }),
      f('language', 'Language', 'select', { options: ['EN', 'FR', 'UK'] }),
      f('source', 'Source'),
      f('status', 'Subscription status', 'select', {
        options: ['UNSUBSCRIBED'],
      }),
    ],
  },
  settings: {
    label: 'Website Settings',
    model: 'siteSettings',
    singleton: true,
    noDelete: true,
    fields: [
      f('siteName', 'Organisation name', 'text', { required: true }),
      f('isDemo', 'DEMO configuration', 'boolean'),
      f('contactEmail', 'Email', 'email'),
      f('contactPhone', 'Phone'),
      f('registeredOffice', 'Registered office / address'),
      f('foundedYear', 'Founded year', 'number'),
      f('legalName', 'Official registered name'),
      f('legalForm', 'Legal form'),
      f('registrationNumber', 'Registration number'),
      f('registrationDate', 'Registration date', 'date'),
      f('officialPublicationUrl', 'Official publication URL', 'url'),
      f('siren', 'SIREN'),
      f('siret', 'SIRET'),
      f('socialLinks', 'Social URLs (network → HTTPS URL)', 'json'),
      f('partnerLabel', 'Public partner heading', 'select', {
        options: [
          'OUR_PARTNERS',
          'INSTITUTIONAL_PARTNERS',
          'SELECTED_PARTNERS',
          'COLLABORATING_INSTITUTIONS',
        ],
      }),
      media('logoId', 'Site logo'),
    ],
    translations: [
      f('organisationName', 'Localised organisation name'),
      f('addressText', 'Address display text'),
      f('footerText', 'Footer details', 'textarea'),
    ],
  },
  seo: {
    label: 'SEO',
    model: 'pageSEO',
    fields: [
      f('slug', 'Route path (home or projects/example)', 'text', {
        required: true,
        max: 250,
        pattern: '^[a-z0-9]+(?:[-/][a-z0-9]+)*$',
      }),
      f('locale', 'Language', 'select', {
        required: true,
        options: ['EN', 'FR', 'UK'],
      }),
      title,
      f('description', 'Description', 'textarea'),
      f('canonicalUrl', 'Canonical URL', 'url'),
      f('noIndex', 'Hide from search engines', 'boolean'),
      media('openGraphImageId', 'Social share image'),
    ],
  },
  media: {
    label: 'Media Library',
    model: 'media',
    noCreate: true,
    noDelete: true,
    fields: [
      slug,
      f('credit', 'Credit'),
      f('copyrightNotice', 'Copyright notice'),
      f('licenseUrl', 'Licence URL', 'url'),
      f('visibility', 'Access', 'select', { options: ['PRIVATE', 'PUBLIC'] }),
      f('isDemo', 'DEMO placeholder', 'boolean'),
    ],
    translations: [
      f('altText', 'Alt text', 'text', { required: true }),
      f('caption', 'Caption', 'textarea'),
    ],
  },
};
