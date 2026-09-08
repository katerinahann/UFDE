
### About page content

The `/about`, `/fr/about` and `/uk/about` pages share the UFDE design system.
Organisational facts and licensed carousel photographs are defined in
`packages/config/src/about.ts`. In connected CMS mode, `GET /settings` supplies
`aboutProfile`; authenticated editors can replace it with
`PUT /admin/settings/about-profile`. The validated payload includes `founded`,
`registeredOffice`, localized `organisationType` and `geographicalFocus` objects
(`en`, `fr`, `uk`), and 2–10 `photos` with `url`, `alt`, `credit`, `source`,
`licenseUrl`, and `licenseLabel`. External image hosts must be allowlisted.
The demo seed initializes this setting without overwriting existing edits.
Static Vercel deployments need a rebuild after CMS changes.

Institutional photographs are illustrative and do not imply affiliations:
Institut de France — Guilhem Vellut, CC BY 2.0; Sorbonne exterior — Sixlocal,
CC BY-SA 3.0. Full source and license links are stored with each photo and
rendered on the page. Local WebP copies are resized; page layouts crop them.

### Activities

The Activities carousel filters locally using the five stable category keys in
`packages/config/src/activities.ts`. Set each activity translation's `category`
to one of those keys; the UI supplies its translated label. Demonstration records
are explicitly labelled and are not claims of real events.

Optional activity fields are stored without a schema change in `SiteSetting`.
Authenticated editors use `PUT /admin/activity-details/:slug?locale=en` (or `fr`,
`uk`) with `gallery` and `partners` arrays, plus optional ISO `date`, `location`,
`programmeUrl` and HTTPS `eventUrl`. Gallery items use `url`, `alt`, optional
`credit`; partners follow the existing Partner DTO. The public read endpoint is
`GET /activity-details/:slug?locale=en` and only exposes published activities.
Absent metadata renders honest empty states. Rebuild static deployments after
content edits. No database connection or live editorial API was exercised during
this implementation's build verification.

### Projects

`/projects` uses local category tabs and a responsive three/two/one-column grid.
Project records supply titles, summaries and images. Additional localized data
is stored in `SiteSetting` through authenticated
`PUT /admin/project-details/:slug?locale=en` (`fr` and `uk` also supported).
`GET /project-details/:slug?locale=en` only reads published project metadata.

The payload shape is documented by `ProjectDetailsDto` and `ProjectDetails`:
optional status (`Ongoing`, `Upcoming`, `Completed`, `Planned`), category key,
start/end ISO dates, institution type, strategic area, lead, background and
contact email; arrays for countries, partners, objectives, activities, outcomes,
resources and related activity slugs; and a `featured` boolean. Set one project
per locale as featured; if several are flagged, the first in publication order
is shown. Category keys are in `packages/config/src/projects.ts`. Resource URLs
accept HTTPS or local `/documents/*.pdf` files. Dates are validated so the end
cannot precede the start. Related activities use explicit links, not guesses.

Demo project badges and dates are examples. Missing approved facts use empty
states; no project metrics or affiliations are generated. Metadata edits require
a rebuild for static Vercel deployments. The project details reuse existing
SiteSetting storage, so no database migration is required.

### Publications

Publications use an explicit editorial object (`Publication`, `PublicationDto`),
separate from legacy demonstration content. Authenticated editors save with
`PUT /admin/publications/:slug?locale=en` and list drafts through
`GET /admin/publications?locale=en`; French and Ukrainian locales are supported.
The public `/publications` API, website, detail routes and sitemap accept only
`status: "Published"` with `isDemo: false`. Draft, Forthcoming and demonstration
records are excluded, including from direct public detail requests. Legacy
PUBLICATION content records are no longer exposed through the generic API.

Fields include title, slug, type, coverImage (`url`, `alt`), summary, abstract,
executiveSummary, authors, publishedAt, year, language, pdfUrl, externalUrl, doi,
isbn, citation, featured, status and isDemo. Published records require authors,
a summary, an abstract, and a publication date or year. Working Papers and
Articles & Insights filters only appear when published content of those types
exists. The built-in preview intentionally contains no published research.

For local PDFs, add the file under `apps/web/public/documents/` and use
`/documents/filename.pdf`. S3-compatible storage and remote files use browser-
accessible HTTPS URLs (public object URLs or appropriately managed signed URLs).
Avoid short-lived signed URLs in static exports; rebuild before expiry or use a
stable download endpoint. Configure external cover hosts using the existing image
allowlist. Remote servers control Content-Disposition, so cross-origin PDFs may
open in the browser instead of triggering a download. No storage credentials are
placed in client code. Rebuild Vercel after editorial changes, including status
changes, to update static pages and remove previously published output.

### Team profiles

The Team page shows approved CMS members; no people are invented. Existing
`POST /admin/team` and `PUT /admin/team/:id` manage the member's full name,
localized role/biography, portrait, published flag and ordering. Add the localized
profile fields with `PUT /admin/team/:id/profile?locale=en` (`fr`, `uk` supported):
`category` (`leadership` or `advisory`), `expertise` string array, optional
`institutionRole`, `email`, `linkedin`, `orcid`, `googleScholar`, and
`institutionalProfile` HTTPS URLs. `GET /admin/team?locale=en` includes profile
metadata for editorial review. Profiles use existing SiteSetting storage.

Public members must be published, have an explicit category and a role in the
requested locale. Advisory Board is hidden when no eligible members exist.
Missing portraits use a neutral placeholder; professional links appear only when
provided. Desktop selection expands immediately beneath its row; mobile uses a
focus-managed dialog with Escape/close support. Rebuild static deployments after
CMS changes. The meeting hero is illustrative, credited to woodleywonderworks,
CC BY 2.0, source https://commons.wikimedia.org/wiki/File:Team_Meeting.jpg; the
local WebP is resized and the layout crops it. It does not depict the UFDE team.

### Governance & Transparency

The About dropdown (hover, click or keyboard) and its mobile disclosure link to
Governance & Transparency. The About CTA and footer Important column also link
there. Mission & Values and Our Story point to existing About sections; no
unverified institutional history was created.

`GET /governance?locale=en` serves public governance content. Authenticated
`GET /admin/governance?locale=en` includes private documents and
`PUT /admin/governance?locale=en` replaces localized content. French and Ukrainian
are supported. The `GovernanceContent` / `GovernanceDto` object contains the four
introductory facts, overview, legal fields, editable structure descriptions,
policies, financial information, compliance, contact email and documents.
Missing values display “To be updated”; supplied defaults live in
`packages/config/src/governance.ts`. No legal registration category or number is
inferred. Administrators should verify the governance structure against the
registration documents before publishing formal descriptions.

Documents have id, title, description, type, optional publicationDate, language,
optional fileUrl, public flag and sortOrder. Private entries are removed by the
public API, not merely hidden in CSS. Keep private files in access-controlled
storage; a public flag does not revoke a separately public storage URL. Add a
file URL only after uploading the actual file. Public entries without a file
show Coming soon. The Code of Ethics CTA uses the public `code-ethics` file when
available, otherwise it points to the documents section with Coming soon status.
Rebuild static Vercel exports after content or privacy changes.
