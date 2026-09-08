# Newsletter subscriptions

The first version stores subscriptions only. No campaigns, automated welcome messages, or provider synchronization are sent.

## Deploy

1. Apply Prisma migrations with `pnpm --filter @ufde/api db:migrate`, then deploy the Nest API.
2. On Vercel, set `NEWSLETTER_BACKEND_URL=https://YOUR_API/v1/newsletter` (the newsletter base URL, without `/subscribe`). Set the same `CONTACT_PROXY_SECRET` on Vercel and the API so per-IP throttling can trust signed proxy headers. Never enable Express trust-proxy for arbitrary incoming headers.
3. Set `NEXT_PUBLIC_DEMO_MODE=false` to enable live submissions; demonstration mode stays visibly labelled and does not write data. Rebuild the website after changing public environment variables.
4. Leave `NEWSLETTER_DOUBLE_OPT_IN=false` (default) for initial single opt-in. The separate unchecked consent control is required. `confirmedAt` stays empty for single opt-in; it records email ownership confirmation only.

Next development uses a rewrite to `http://localhost:4000/v1/newsletter/subscribe`, overridable through `NEWSLETTER_BACKEND_URL`. Vercel uses `/api/newsletter?action=subscribe`. A separate frontend may set `NEXT_PUBLIC_NEWSLETTER_ENDPOINT` to the API endpoint and must have its origin allowed by API CORS.

## API

Nest routes are `/v1/newsletter/subscribe`, `/v1/newsletter/confirm` and `/v1/newsletter/unsubscribe`. The requested unversioned `/newsletter/...` paths are also accepted by the server. All use POST with JSON, validation and throttling (10 requests/minute/IP per route). The current throttler is process-local: use shared throttler storage or an edge limit when scaling to multiple API replicas.

Subscribe body:

```json
{"email":"person@example.org","language":"fr","source":"footer","consent":true,"website":""}
```

Languages: `en`, `fr`, `uk`. Source is a bounded lowercase identifier and is attribution only, not a trusted security field. Email is trimmed/lowercased and protected by a database unique constraint. Per-email transaction locks serialize concurrent subscribe requests. Responses use HTTP 202 with a neutral `received` status, including duplicates and previously unsubscribed addresses. Signup never silently reactivates an unsubscribed address.

The Prisma model exposes `language` while preserving the existing database `locale` column. It includes source, status, createdAt, confirmedAt and unsubscribedAt, plus consent audit fields and hashed tokens. Existing records are preserved; their source defaults to `website`.

Confirm/unsubscribe body:

```json
{"token":"64-character-hex-token-delivered-privately-to-the-recipient"}
```

Unsubscribe returns the same successful result for unknown and already-used tokens. It preserves the first unsubscribe timestamp and cancels pending confirmation. GET requests never change subscription state, protecting recipients from email link scanners. A future email preferences page should require an explicit POST action. Do not expose token issuance by email address publicly.

## Double opt-in and future providers

`NewsletterDelivery` is the dependency-injection boundary for a Brevo, Mailchimp, SendGrid or other transactional confirmation adapter. Replace its binding in AppModule with an implementation of `isConfigured()` and `sendConfirmation(message)`. It receives recipient, language, random confirmation/unsubscribe tokens and an idempotency key. Build links using a trusted configured public origin; never accept a redirect URL from the signup request. Do not log tokens or return them in public subscribe responses.

Enable `NEWSLETTER_DOUBLE_OPT_IN=true` only after implementing delivery and confirmation/preferences pages. Without a configured adapter, the API returns 503 before storing anything. Pending confirmation tokens expire after 24 hours and are consumed once. Repeated pending requests do not resend during that window. Failed delivery keeps the row pending and clears the token so the visitor can retry; this initial version has no background mail retry worker.

The internal `issueUnsubscribeToken(subscriberId)` method is available for a future authorized provider adapter to create a recipient-specific link before sending. Issuing a new token invalidates the previous one. Campaign delivery is intentionally outside this version. Future campaigns must query current `SUBSCRIBED` records and honor local/provider suppression immediately before sending.

## Verification

Tests use an isolated PostgreSQL-compatible database and cover migration compatibility, normalized duplicates, metadata, unsubscribe suppression/idempotency, missing providers, confirmation expiry/replay and delivery failures. Production credentials and the live database are not used by tests.
