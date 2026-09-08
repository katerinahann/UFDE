# Vercel deployment

Use the repository root (Root Directory blank or `.`). The root `vercel.json`
sets the Vite framework preset, `pnpm run build:vercel`, and the `dist` output.
Redeploy the newest commit after changing the Root Directory, if necessary.

This is a static deployment compatible with the Vite preset, not a migration of
React components away from Next.js. The build exports the existing Next.js app
and places its public HTML, CSS, JavaScript and images in `dist`. Never serve
`.next` as an ordinary static directory. Clean URLs preserve direct access to
localized pages and detail pages; missing paths retain a real 404 response.

The NestJS API and PostgreSQL database are not deployed by this static build.
Demo mode stays enabled by default; forms do not send or store data in demo mode.
To enable live content, deploy the API separately and set NEXT_PUBLIC_DEMO_MODE=false,
API_INTERNAL_URL and NEXT_PUBLIC_API_URL to its HTTPS /v1 endpoint. Set CORS_ORIGINS
on the API to the exact frontend origin. New CMS routes require a new static build.
Set NEXT_PUBLIC_SITE_URL to the final canonical HTTPS domain; otherwise Vercel's
production hostname is used when available.

Validation: `pnpm run build:vercel` must produce dist/index.html, localized HTML,
robots.txt, sitemap.xml, and the _next/static assets. `pnpm run build` remains
available to build the NestJS API and the normal Next.js server application.
