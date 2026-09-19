# SEO and security configuration

## SEO

Set `NEXT_PUBLIC_SITE_URL` to the final public HTTPS origin, and `NEXT_PUBLIC_DEMO_MODE=false` only for the approved live site. Live builds fail without the public URL rather than publish an incorrect canonical domain. Demo builds remain noindex and have an empty sitemap. Admin and design-system pages remain noindex in all modes.

Titles, descriptions, canonical URLs, EN/FR/UK alternates and OpenGraph/Twitter cards are generated for each route. The CMS Page SEO module can override titles, descriptions and images. Content photos/covers are used for detail sharing cards; missing images use `/images/ufde-opengraph.png` (1200×630). The adjacent SVG is the editable navy/white/gold source.

JSON-LD describes Organization, WebSite and WebPage, plus published Article, Event, Person and CreativeWork/Report content where applicable. Events require an actual date and location; other activity stories use Article. No prices, attendee counts, government affiliation, event organizers or endorsements are invented. Official legal name comes from Governance settings. Logo comes from an approved public Site logo upload; it is omitted until provided. Social profiles come from configured website settings. JSON-LD escapes script-breaking characters.

The sitemap is data-driven from published CMS routes, including projects, activities and publications in all three languages, excluding noindex and noncanonical entries. **The Vercel deployment is a static export: publish/unpublish changes require a new build to update both the pages and sitemap.** Configure a Vercel deploy hook in the publishing workflow if automatic refresh is needed. This implementation does not pretend static files are request-time dynamic.

Reference guidance: [Google Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization) and [Google Event structured data](https://developers.google.com/search/docs/appearance/structured-data/event). Validate the final live URL with Google Rich Results Test and submit `/sitemap.xml` to Search Console after deployment; these external checks have not been run against a live deployment.

## Security controls

- Nest Helmet, exact-origin credentialed CORS, 128 KB request bodies, global whitelisted DTO validation, bounded input nesting and control-character sanitization. Passwords/tokens are not altered. Plain-text CMS content is escaped by React instead of rendered as HTML.
- Server-side opaque sessions with hashed tokens, expiry/idle limits and production Secure/HttpOnly/SameSite cookies. Passwords use salted scrypt. No frontend-only authorization: SessionGuard/AdminGuard authenticate API requests and CMS services enforce per-module role permissions.
- Cookie-authenticated mutations require a trusted Origin and a session-bound CSRF token. Login verifies Origin. Public contact/newsletter forms do not use privileged cookies and have DTO validation, honeypots and throttling; newsletter consent remains separate.
- Prisma query parameters and tagged SQL protect values from SQL injection. Contact advisory locks cast their void result to text for Prisma compatibility.
- Uploads require authenticated media-write permission, byte-signature validation, file/field limits, image decoding/pixel limits and static SVG allowlisting. Generated names avoid path traversal. Private files require authorization; download responses use nosniff and a sandbox CSP. Files live outside PostgreSQL. PDFs are forced to download; this is not an antivirus scanning service.
- Vercel and Next headers deny framing and object embedding. Static-export CSP allows inline Next hydration scripts/styles; it is defense in depth, not a substitute for escaping. Nonce-based strict CSP requires request-time rendering or a dedicated per-build hash pipeline.
- `.env.example` contains local placeholders only. Never use NEXT_PUBLIC_ for credentials. API startup rejects public secret variable names and weak configured proxy secrets. Sessions do not use JWTs; current mail transport uses Resend, not SMTP. Storage/database/mail credentials remain server-only. Production environment values and historical Git secrets were not accessed or audited.

## Deployment responsibilities

Use HTTPS, install the same random `CONTACT_PROXY_SECRET` on Vercel and the API, configure real database/mail/storage values in the deployment secret store, set exact HTTPS `CORS_ORIGINS`, and disable demo mode after review. Never use sample credentials. The newsletter/general Nest throttler is process-local: use shared storage or edge limits when running multiple API replicas. Authentication/contact limits already persist in PostgreSQL. Set infrastructure request limits and keep dependency/security updates in the release process.

The static `/admin` HTML shell is public but carries no protected data. Every protected API read/write is authenticated and authorized server-side. API credentials must never be bundled into that shell.
