# Remote-only blog storage

Articles always come from `healthos.content_catalog` and private objects in `s3://healthos-exp/seo-growth/articles/`. URLs remain `/blog/<slug>/`. `BLOG_CONTENT_SOURCE` is no longer used, and there is no local fallback. Repository originals remain for migration/testing but are not read by the runtime.

## Existing server credentials

At the owner's explicit request, blogs reuse `MONGODB_URI`, `AWS_REGION`, and the AWS SDK credential provider chain (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, optional `AWS_SESSION_TOKEN`), just like observations. The bucket's region is `us-east-2`. No runtime `BLOG_MONGODB_URI`, `BLOG_S3_REGION`, or `BLOG_AWS_*` settings are needed. Both build and runtime need access. Existing observation bucket/prefix configuration is unchanged.

The shared MongoDB credential has broad admin privileges. Reusing it is an owner choice, not least privilege. Blog code reads only the catalog, but this does not restrict the credential itself. A separate read-only identity remains recommended future hardening. Never give this shared account to a bot. The shared AWS identity also retains its observations access. No permissions are changed by the code.

Keep credentials server-only: no `NEXT_PUBLIC_*`, source-code secrets, or browser exposure.

## Caching and publication

Visitor → Next.js cache → published MongoDB metadata → exact versioned S3 Markdown → sanitized HTML. Catalog lists do not fetch every article body. Data and page caches revalidate hourly, and new slugs render on demand. Failed regeneration preserves the last successful cached page; uncached pages may fail during an outage. Drafts and missing articles return 404.

Only body-only Markdown is supported, not executable MDX. HTML sanitization removes scripts, styles, SVG, iframes and event handlers; JSON-LD is escaped. Media URLs use `/blog-media/<slug>/<version>/<hash>.<extension>/`; only current published manifest assets are served with verified checksum and raster MIME. Browser caching is five minutes; shared caching one hour. Old-version media may stop loading in stale pages after publication. Withdrawals do not revoke downloaded copies or instantly purge CDNs; urgent removals require a hosting purge.

`BLOG_REVALIDATE_SECRET` is optional for reading, but needed for immediate publishing cache refresh. Use at least 32 random characters. POST `/api/blog/revalidate/` with `Authorization: Bearer <secret>` and JSON `{ "slug": "example-article" }`. It invalidates blog data, article, index, sitemap and llms caches, not content. Pages regenerate on the next request; verify the live page before distributing links. Without the secret, the endpoint returns 503 and hourly revalidation still works. Apply hosting rate limits.

Publish by uploading a complete immutable version plus manifest, verifying its bytes, then conditionally updating the catalog pointer against the previous version. Do not replace a live record with an unfinished draft. Configure a unique slug index before concurrent publishing. No unrestricted publishing API or bot connection is included.

## Catalog schema

Schema version 1: `slug`, `title`, `description`, `status`, `date`, `version`, `s3Key`, `sha256`, `assets`, plus optional existing SEO metadata, FAQs and sources. Dates are YYYY-MM-DD strings. Hashes/version IDs are lowercase SHA-256. Keys are exactly `seo-growth/articles/<slug>/<version>/article.md`; assets are hash-named files under the same version's `assets/` prefix. Limits: 1 MiB Markdown, 20 MiB per image, 100 assets per article; listings currently cap at 10,000 records.

## Migration and verification

The original 11 articles were uploaded as 48 verified S3 objects and their catalog records marked published. Local originals have not been removed.

- `npm run test:blog`: model, sanitizer and migration unit tests.
- `npm run blog:migrate`: local-only dry run. The original importer's `--apply` still requires dedicated migration-only `BLOG_*` credentials and a unique slug index; it refuses broad privileges and conflicting records. These script settings are separate from runtime settings.
- `scripts/stage-blog-catalog.mjs`: owner-authorized, insert-only MongoDB staging as draft/pending S3. Default dry run; `--apply` writes.
- `scripts/complete-staged-blog-migration.mjs`: owner-authorized operator migration using the frontend credential and `../secrects/healthos-vercel-s3_accessKeys.csv`. It validates exact staged/completed records, uses create-only S3 writes, verifies every object before promotion, then compares the entire staged document atomically to avoid overwriting edits. Default dry run; `--apply` writes. No IAM or deployment changes.
- `node --env-file=.env.local --experimental-strip-types scripts/test-remote-blog.mjs`: builds the remote-only site, starts a temporary loopback server on port 3217, checks all 11 bodies and 26 catalog image responses/checksums, cache headers, index/sitemap/llms, missing-page 404 and webhook authentication/refresh. Credentials live only in processes. Stops its server afterward; replaces the local `.next` build.

Standalone scripts require Node 22.18+. Keep originals until production acceptance. Shared landing-page screenshots must not be deleted as blog cleanup. A rollback to filesystem articles now requires reverting remote-only code and redeploying, not changing a flag.

S3 reads need `s3:GetObject` on `arn:aws:s3:::healthos-exp/seo-growth/articles/*`; uploads additionally need `s3:PutObject`. No ListBucket, DeleteObject, ACL changes or public access are required. Keep Block Public Access enabled. SSE-KMS may need permissions on the specific KMS key. Future bot credentials must be separate and restricted to their collection/prefix.
