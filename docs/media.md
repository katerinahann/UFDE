# Centralized media storage

The administration Media Library uses one upload/processing service. PostgreSQL stores file metadata, dimensions, storage keys, credit/copyright, translations and variant URLs. Image/PDF bytes are never written into database columns. Files start private; existing session, CSRF and role checks apply to upload and private downloads.

## Development

The default outside production is a local `uploads/` directory beneath the API working directory (`apps/api/uploads/` when started through pnpm). Both repository and API upload directories are gitignored. Override with an absolute path if needed:

```dotenv
MEDIA_STORAGE=local
MEDIA_DIRECTORY=/absolute/path/to/UFDE/uploads
```

Files are outside the static web root. The API serves them through visibility-checked media endpoints, rather than exposing the uploads directory directly.

## Production: AWS S3, Cloudflare R2 or DigitalOcean Spaces

Production defaults to S3 storage and fails closed if no bucket is configured. Set these on the persistent API, never as `NEXT_PUBLIC_*` variables:

```dotenv
MEDIA_STORAGE=s3
S3_BUCKET=your-private-bucket
S3_REGION=your-region
S3_ENDPOINT=https://your-s3-compatible-endpoint
S3_FORCE_PATH_STYLE=false
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
```

| Provider | Endpoint | Region |
| --- | --- | --- |
| AWS S3 | Omit `S3_ENDPOINT` for the standard AWS endpoint | Actual bucket region, for example `eu-west-3` |
| Cloudflare R2 | `https://ACCOUNT_ID.r2.cloudflarestorage.com` | `auto` |
| DigitalOcean Spaces | `https://REGION.digitaloceanspaces.com` | Actual region, for example `fra1` |

Set `S3_FORCE_PATH_STYLE=true` when the provider requires path-style bucket addressing. If custom S3 credentials are omitted, the AWS SDK credential chain supports IAM workload roles or standard AWS credential variables. Require HTTPS in production. Restrict credentials to the relevant bucket's object read/write/delete operations; keep bucket access private. Browser CORS on the bucket is unnecessary because uploads and downloads pass through the API.

The upload adapter records LOCAL/S3 and the bucket on each Media record. Changing the default provider affects new uploads only. Existing local files still need their original volume mounted; changing environment variables does not copy files to a bucket. Historical media without variants remains downloadable. New uploads create all variants atomically with their metadata; failed persistence triggers best-effort cleanup of written objects. Storage outages during cleanup may require an orphan-object review.

The Vercel `ADMIN_BACKEND_URL` setting and existing `/api/admin/*`, `/api/media/*` rewrites continue to apply. Media URLs are stable application URLs, not expiring signed URLs. Private files and variants require authentication; public media additionally requires `visibility=PUBLIC` and `isDemo=false`. The API rechecks visibility on every download. Objects are not published through a public bucket or CDN, so no cached private access is introduced.

## Image outputs

| Size | Bounding box | Behavior |
| --- | --- | --- |
| thumbnail | 320 × 320 | Fit entirely inside, preserve aspect ratio |
| medium | 960 × 960 | Fit entirely inside, preserve aspect ratio |
| large | 2400 × 2400 | Fit entirely inside, preserve aspect ratio |
| original | Source dimensions | Raster/PDF bytes retained exactly |

No automatic crop, trim, stretch, background flattening or upscaling is performed. EXIF orientation is applied to derivatives and unnecessary embedded metadata is removed from them. Original raster photographs remain unchanged, including their embedded metadata. Photographs receive WebP (quality 82) and AVIF (quality 55) derivatives. Logos receive lossless WebP and transparent-capable PNG derivatives; SVG stays vector. The public image URL selects large WebP for photographs, original SVG for SVG logos, and large PNG for raster logos. Clients can choose other sizes from the returned `variants` URLs. Next's second optimization pass is disabled because these images are already processed centrally.

[Sharp resize documentation](https://sharp.pixelplumbing.com/api-resize/) describes the aspect-preserving `inside` fit and no-upscaling behavior. Its [output documentation](https://sharp.pixelplumbing.com/api-output/) covers the selected WebP/AVIF encoders.

Example response fields:

```json
{
  "url": "/api/media/MEDIA_ID?size=large&format=webp",
  "alt": "An administrator-written description",
  "caption": "Optional localized caption",
  "credit": "Photographer / source",
  "copyrightNotice": "Administrator-supplied rights notice",
  "variants": [
    {"name":"thumbnail","format":"webp","url":"/api/media/MEDIA_ID?size=thumbnail&format=webp"},
    {"name":"medium","format":"avif","url":"/api/media/MEDIA_ID?size=medium&format=avif"},
    {"name":"large","format":"webp","url":"/api/media/MEDIA_ID?size=large&format=webp"},
    {"name":"original","format":"jpg","url":"/api/media/MEDIA_ID?size=original&format=jpg"}
  ]
}
```

Alt text and captions are edited in EN/FR/UK tabs. Credit, copyright notice and licence URL are shared metadata. No stock images, AI photographs, replacement logos or invented attribution are generated by the service.

## Source guidance and limits

Choose the intended use during upload:

- Hero: 1920 × 800 or larger source.
- Activity/project: 1600 × 1000 preferred.
- Team portrait: 1000 × 1200 preferred.
- Logo: original official SVG preferred; transparent PNG fallback.

Hero uploads below 1920 × 800 are rejected. Other raster sources below the preferred dimensions receive a warning and retain their actual resolution. SVGs do not need pixel-density warnings because the source remains vector. SVG upload is restricted to logo use. Static vector elements, text and local gradient/clip references are supported. Scripts, event handlers, DTD/entities, CSS/style blocks, embedded raster/HTML content and external resources are rejected. Export unsupported logos as plain SVG with presentation attributes or use the official transparent PNG. Accepted SVGs are reserialized into safe static markup; no geometry or viewBox cropping is applied.

The current same-origin upload path accepts up to 4 MiB (SVG: 1 MiB), with a 40-megapixel raster decoding limit and two processing slots per API instance. This accommodates [Vercel's function payload limit](https://vercel.com/kb/guide/how-to-bypass-vercel-body-size-limit-serverless-functions). Generated variants must also fit that transport limit. Larger originals require a separate direct-to-object-storage upload flow; it is not enabled by this implementation. PDFs keep an original only and are served as attachments.

## Migration and verification

Apply `202609090001_media_variants` after the existing migrations (`pnpm db:migrate`). This is additive and does not move or overwrite existing original files. Configure production storage before enabling uploads.

Automated tests cover originals, image formats/dimensions, transparency, no-upscaling, source warnings, SVG rejection, local storage traversal protection, signed S3-compatible round-trips against an isolated HTTP test server, failed-upload cleanup and private access. No AWS/R2/Spaces account is contacted by the test suite. A real deployment still needs valid storage credentials and a storage smoke test in that environment.
