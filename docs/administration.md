# UFDE administration

The responsive navy/gold dashboard is at `/admin`. It includes activities, projects, publications, authors, team, expertise, partners, governance documents, strategic areas, categories, contact submissions, newsletter subscribers, website settings, SEO and media. Shared metadata stays outside EN/FR/UK translation tabs. SEO records are grouped by route and locale; after creating the first locale, open the record to switch language tabs.

## Deployment

The static Vercel website includes the dashboard shell and same-origin API proxies. Authentication, database access and uploads run on the persistent Nest API service; a static website alone cannot provide these services.

1. Deploy the Nest API with PostgreSQL and a persistent volume. Apply the migrations using the fresh/existing database instructions in `apps/api/prisma/README.md`.
2. Configure the API environment:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection URL |
| `NODE_ENV=production` | Secure cookie policy |
| `CORS_ORIGINS` | Exact HTTPS website origins, comma-separated, no paths or wildcards |
| `MEDIA_DIRECTORY` | Absolute path on a persistent volume, writable only by the API service |
| `CONTACT_RATE_SECRET` | At least 48 random characters; retained contact protection |
| `LEGAL_APPROVED=true` | Existing institutional content release gate, after actual review |
| `DEMO_MODE=false` | Disable legacy public demonstration content |

3. Configure Vercel server-side `ADMIN_BACKEND_URL=https://YOUR-API-HOST/v1/admin`. The same setting works with local Next server rewrites; local default is `http://localhost:4000/v1/admin`. Add the Vercel production origin to API `CORS_ORIGINS`. Preview origins must be explicitly added if preview admin access is required.
4. For real public content, set `NEXT_PUBLIC_DEMO_MODE=false` and `API_INTERNAL_URL=https://YOUR-API-HOST/v1` on the website build. Requests use the normalized `/v1/cms-public` read API. No real content is automatically copied from legacy JSON records. Review/migrate existing records before switching a live site; temporary `CMS_LEGACY_CONTENT=true` retains the old readers during that review. New admin writes always use normalized storage.
5. Configure an administrator through the one-time CLI below. No default password or active demo account exists.
6. Redeploy the website. It must export `dist/admin.html` and retain the `/api/admin/*` and `/api/media/*` rewrites from `vercel.json`.

Static public pages require a rebuild after content/settings/SEO changes. Dashboard CRUD and sessions are live API requests and do not need a rebuild. Backend/API releases require their own deployment. This change does not provision hosting, connect to a production database, or create a real administrator automatically.

### Create or recover an administrator

Set `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_NAME` and `ADMIN_BOOTSTRAP_PASSWORD` through your terminal's secure environment or secret manager, then run:

```sh
pnpm --filter @ufde/api admin:create
```

Use a unique password of 14–256 characters. The command does not print it. Remove the bootstrap password from the environment after the command completes. Existing accounts cannot be reset accidentally: an intentional reset additionally requires `RESET_ADMIN_PASSWORD=true`. Resetting revokes that user's sessions. There is no public registration endpoint.

The command creates `administrator` (`*`), `editor`, `publisher` and `reviewer` roles. Assign roles through the protected database/operator process; there is no user self-promotion endpoint. Permissions use `module:read`, `module:write`, `module:publish`, `module:delete`. Contact/subscriber access and website settings are excluded from default editorial roles. An administrator can perform every requested action; custom roles can narrow access further.

## Security behavior

- Passwords use salted Node scrypt (N=32768, r=8, p=1). Credentials are never stored in browser storage.
- Sessions use random 256-bit tokens. Only SHA-256 hashes are stored in PostgreSQL. Production cookies use `__Host-`, Secure, HttpOnly, SameSite=Lax and Path=/, without a Domain attribute.
- Sessions have an eight-hour absolute lifetime and a 30-minute idle timeout. Login rotates the token; logout/reset revokes it. Every request rechecks active status and role grants.
- Mutations require an exact trusted Origin and a session-bound CSRF header. Login checks Origin and validates its JSON body. Missing/invalid sessions fail closed.
- Persistent login counters allow ten attempts per email and 100 per direct upstream IP per 15 minutes. Forwarded IP headers are deliberately not trusted; behind the proxy the IP bucket is conservative/shared, while the email bucket is independent.
- Legacy bearer-token administration has been removed. Legacy editorial endpoints now require a full administrator session and the same CSRF protection.
- CMS payloads are allowlisted. Translation uniqueness, field lengths, file types, references, publication state and role permissions are validated server-side. Stale updates/deletes return 409 rather than silently overwriting another editor.
- Audit records contain actor, action, module and record ID, without passwords, session tokens or contact message bodies.
- Subscriber identity/consent cannot be fabricated through the dashboard. Admins can unsubscribe/delete records; public signups enter Pending status. Confirmation-email delivery is a separate newsletter workflow, not an automatic marketing subscription.

Periodically remove expired sessions and expired login buckets after the operational retention period. The schema indexes their expiry fields. Apply an appropriate audit/contact retention policy for the organisation; no automated deletion of institutional records is enabled here.

## Files and publishing

Uploads accept PNG, JPEG, WebP and PDF with signature checks, at most 4 MiB. This leaves room for multipart overhead below Vercel's [4.5 MB function payload limit](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions). Larger uploads require direct object-storage upload integration. The current dashboard uses the persistent API volume; Prisma Media URLs can also represent object-storage/remote files.

Files receive random storage names outside the static web root and start private. Add useful EN/FR/UK alt text in Media Library, then change visibility to Public when approved. Private downloads require a session with media-read permission. PDFs are served as attachments with nosniff and a restrictive CSP. Uploaded file existence is checked before serving; metadata flags alone do not expose a file. This is file-type validation, not an antivirus service.

Publish media before publishing records that use it. Partner records require an actual uploaded logo; explicit project/activity associations establish the displayed relationship. Demo records cannot be published or converted into real content. Create a separate verified record instead. The singleton demo site configuration can be replaced with reviewed real settings and its demo flag cleared.

Governance documents can remain Draft or Coming soon without a download. Available documents require an uploaded PDF. Public document downloads additionally require public visibility. Publications need Published status and authors before publishing. No dummy official documents, logos, metrics or partnership links are created.

For existing public filter tabs, use these stable category slugs:

- Activities: `conferences-events`, `scientific-cooperation`, `education-training`, `policy-development`, `culture-arts`.
- Projects: use the category identifiers defined in `packages/config/src/projects.ts`.

SEO route keys are `home`, `about`, `projects/example-slug`, etc., without a leading slash. Add each desired locale and clear no-index only for approved public pages. Organisation/contact/footer settings and strategic-area content are read at build time from the normalized CMS.

## Verification

`pnpm test` includes password/session/CSRF/role tests, CMS validation tests, and isolated PostgreSQL-engine tests for migrations, seed idempotency, every module's selectors and editable CRUD, and public publication filtering. Test fixtures never use the configured production database. `pnpm typecheck`, `pnpm --filter @ufde/api build` and `pnpm build:vercel` verify API and static deployment output.
