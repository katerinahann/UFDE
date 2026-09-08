# UFDE database

PostgreSQL / Prisma 7. Every model and explicit join has `createdAt` and `updatedAt`. Prisma maintains `updatedAt`; direct SQL writers must maintain it themselves.

## Localization and relationships

Content entities have stable, globally unique slugs. Translations use `Locale` (`EN`, `FR`, `UK`) with unique `(parentId, locale)` constraints. Map lower-case API locales at the repository boundary. Locale prefixes distinguish routes; slugs are shared across languages.

Media, dates, status, authorship and partnerships are shared across translations. `MediaTranslation` stores alt text/captions. `DocumentTranslation.fileId` overrides the shared file only when a genuinely translated document exists. Media URLs support local, object-storage and remote files; `Publication.language` describes the underlying publication, independently of translated abstracts.

`PublicationAuthor` is reusable; `PublicationAuthorship` controls order and corresponding authors. `ProjectPartner` / `ActivityPartner` require explicit approval. A registry entry does not establish endorsement. Public headings use `SiteSettings.partnerLabel`.

Public queries must require `published: true`, `isDemo: false`, and `publishedAt` null or not in the future. Publications also require `status: PUBLISHED`. Documents also require `public: true`; provide downloads only for real accessible files. `COMING_SOON` does not imply a downloadable file. Media access needs application/storage enforcement; a database flag does not secure public URLs. Validate date ranges and publication approvals in application services.

`SiteSettings` provides nullable legal fields: missing values must not be invented. `PageSEO` is unique per route slug/locale and defaults to no-index. Users start inactive; role permissions are explicit strings. Authentication and authorization enforcement remain application responsibilities.

## Compatibility

The original `Content`, `ContentTranslation`, `Asset`, `Page`, singular `SiteSetting`, and `Subscriber` tables remain for current API compatibility. Existing team JSON fields and contact submissions remain intact. Team slugs are backfilled as `legacy-<id>`; category remains unset until reviewed.

Current API repositories still use legacy storage. The normalized domain is ready for a subsequent repository/content cutover. Review existing JSON before migrating it; do not automatically republish it. Singular `SiteSetting` also contains operational contact queues and rate limits and must not be bulk converted into public settings.

## Apply migrations

`202609080001_legacy_baseline` describes the original schema. `202609080002_normalized_platform` adds the normalized domain without dropping legacy data.

For an empty database, configure `DATABASE_URL`, then run from the repository root:

```sh
pnpm db:generate
pnpm db:migrate
```

For an existing database previously created with `db push`, back up and verify that its schema matches the baseline first. Only after verifying that match, run from `apps/api`:

```sh
pnpm exec prisma migrate resolve --applied 202609080001_legacy_baseline
pnpm exec prisma migrate deploy
```

Do not run baseline CREATE TABLE statements against an already populated database. Resolve schema discrepancies before baselining. These files do not automatically reset or baseline any existing database.

## Demo seed

Set an explicit development `DATABASE_URL`, then:

```sh
ALLOW_DEMO_SEED=true pnpm db:seed
```

The seed refuses production mode, runs transactionally, and uses stable upserts without overwriting existing entries. Domain fixtures are unpublished and marked `isDemo`. Partner placeholders have no logos or relationship links. Document placeholders are private drafts without files. All localized text is explicitly marked DEMO. The inactive `.invalid` account has no password. No legal facts, official documents, subscriptions or contact messages are fabricated. Fixtures are not exposed through existing legacy public API repositories.

## Administration extension

`202609080003_admin_sessions` adds revocable hashed sessions, persistent login
buckets, audit records and localized website settings. The `/admin` dashboard
writes normalized models. Public `/v1/cms-public` readers are available, and new
website builds use them outside demo mode; use `CMS_LEGACY_CONTENT=true` temporarily
while reviewing/migrating legacy content. Legacy tables remain intact.
See `docs/administration.md` for the complete deployment and account setup.
