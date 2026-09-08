
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
