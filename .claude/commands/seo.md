# SEO Review & Implementation

Review or implement SEO best practices for the 3Beeez Next.js site. Apply all relevant items from the checklist below.

## Meta & Head

- Every page must export a `generateMetadata()` function (App Router) with `title`, `description`, `openGraph`, and `twitter` fields
- Titles: `<Page Name> | 3Beeez` pattern, max 60 chars
- Descriptions: 120–155 chars, include primary keyword naturally
- Canonical URLs: set `alternates.canonical` on pages with potential duplicate content (e.g. `/purchase?plan=monthly` vs `/purchase`)
- No duplicate `<title>` or `<meta name="description">` tags

## Open Graph & Social

- `og:title`, `og:description`, `og:image` (1200×630px), `og:url`, `og:type` on all public pages
- Twitter card: `summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`
- OG images should be served from `/app/opengraph-image.tsx` (Next.js dynamic OG) or static in `/public`

## Structured Data (JSON-LD)

- Homepage: `Organization` schema with `name`, `url`, `logo`, `contactPoint`
- Pricing/purchase page: `Product` or `Offer` schema
- Add via `<Script type="application/ld+json">` in the page component (not in `<head>` metadata)

## Sitemap & Robots

- `/app/sitemap.ts` — export dynamic sitemap with `lastModified`, exclude `/admin/**`, `/api/**`, `/widget/**`
- `/app/robots.ts` — disallow `/admin`, `/api`, `/portal`, `/widget`
- Verify `next.config.js` does not block crawlers in non-production (check `X-Robots-Tag`)

## Performance (Core Web Vitals)

- Images: always use `next/image` with explicit `width`/`height` or `fill` + `sizes`
- Fonts: load via `next/font` (not `@import` in CSS) to eliminate render-blocking
- Avoid layout shift — reserve space for dynamic content (chat widget, images)
- Check for unused JS — prefer Server Components over Client Components where interactivity is not needed

## URL & Content

- Slugs: lowercase, hyphenated, no trailing slash
- Internal links use `next/link`, never bare `<a>` for same-origin navigation
- `alt` text on all `<img>` / `next/image` — describe the image content, not "image of"
- `<h1>` exactly once per page, heading hierarchy sequential (h1 → h2 → h3)

## 3Beeez-specific

- The `/widget` and `/widget-script` routes should have `noindex` set (they are embedded, not crawlable pages)
- The `/api/*` routes already return non-HTML but confirm no accidental indexing via `X-Robots-Tag: noindex` response header
- `/portal` and `/admin` must have `noindex` (authenticated-only pages)

## Verification checklist before marking done

- [ ] `generateMetadata` present on all public pages
- [ ] No missing `alt` attributes (run: `grep -r '<img' app/ components/ --include="*.tsx" | grep -v 'alt='`)
- [ ] Sitemap and robots files exist
- [ ] No render-blocking font `@import` in CSS files
- [ ] Widget/admin/portal pages have `noindex`
