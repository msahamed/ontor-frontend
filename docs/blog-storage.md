# MongoDB + S3 blog storage

## Implemented, not activated

Public URLs and presentation remain `/blog/<slug>/`. Local articles remain intact. `BLOG_CONTENT_SOURCE=local` (default) reads repository Markdown; `remote` reads `healthos.content_catalog` and private objects in `s3://healthos-exp/seo-growth/articles/`.

No automatic local fallback occurs during a remote outage: that could resurrect withdrawn content or silently serve obsolete articles. ISR retains its last successful result when regeneration fails. Switching the environment back to local and redeploying is an explicit rollback, using the repository snapshot (which will not include future remote-only articles).

The remote-mode implementation requires dedicated blog credentials. It never reuses `MONGODB_URI` or the product's generic AWS credentials. No cloud writes, grants, deployment changes or credential creation are performed just by enabling local code.

## Request path and caching

Visitor → Next.js server/page cache → published MongoDB record → exact versioned S3 body → sanitized HTML. Credentials are never returned to browsers. Lists and the sitemap query catalog metadata only, not every S3 body. Article content and metadata use one-hour tagged caches; page ISR refreshes after one hour or on authenticated invalidation. New slugs render on demand without adding a source-code route.

Remote Markdown is body-only (not executable MDX). Raw scripts, styles, SVG and iframe embeds are not accepted in rendered article HTML. JSON-LD is escaped to prevent script-element injection. Local Markdown now uses the same sanitizer and explicit publication rule; drafts and missing-status articles are not public. Authenticated editorial previews are a future addition, not implemented here.

Media uses `/blog-media/<slug>/<version>/<content-hash>.<extension>/`. The server reads only an asset listed in that article's currently published manifest, verifies its checksum, and serves a restricted raster MIME type. It is not an arbitrary S3 proxy. The bucket stays private, including Markdown and research files. Browser cache: five minutes; shared cache: one hour. Removing/unpublishing an asset does not revoke already downloaded copies or immediately purge every intermediary cache. For urgent removals, purge the hosting CDN explicitly. Old-version media URLs are no longer origin-readable once the catalog points elsewhere; clients with stale article HTML may need a refresh. A dedicated published-media CDN/history policy can be added later.

## Environment (server only)

### Local remote-mode verification

`node --env-file=.env.local --experimental-strip-types scripts/test-remote-blog.mjs` builds and starts an isolated loopback test server on port 3217 using temporary process-only operator credentials. It checks all 11 migrated article bodies, every catalog image/checksum and image cache header, blog index, sitemap, llms listing, missing-page 404 and authenticated cache invalidation. It stops its server afterward and does not persist credentials or change production settings. It replaces the local `.next` build with a remote-mode build; rebuild normally before starting in local mode. Do not delete repository articles or shared screenshots until the production environment has scoped credentials and remote loading has been verified there.

```dotenv
BLOG_CONTENT_SOURCE=local
BLOG_MONGODB_URI=<dedicated scoped connection string; never NEXT_PUBLIC_>
BLOG_S3_REGION=<actual region of healthos-exp>
BLOG_AWS_ACCESS_KEY_ID=<dedicated scoped credential>
BLOG_AWS_SECRET_ACCESS_KEY=<secure secret>
# Optional for temporary credentials:
BLOG_AWS_SESSION_TOKEN=<session token>
BLOG_REVALIDATE_SECRET=<random secret of at least 32 characters>
```

Do not put real values in this document, bot conversations or Git. Use the deployment secret manager. Provide runtime and build environments with the credentials when remote mode is enabled: the blog index/sitemap can be prerendered at build time. Cache keys use the fixed collection/prefix; invalidate caches when replacing storage data.

## Database record (schemaVersion 1)

```json
{
  "schemaVersion": 1,
  "slug": "example-article",
  "title": "An actual buyer question",
  "description": "A specific summary",
  "status": "published",
  "date": "2026-09-07",
  "version": "<64-character lowercase SHA-256 version ID>",
  "s3Key": "seo-growth/articles/example-article/<version>/article.md",
  "sha256": "<SHA-256 of the final Markdown body bytes>",
  "assets": []
}
```

Optional existing metadata: `updated`, `targetKeyword`, `secondaryKeywords`, `intent`, `icp`, `heroImage`, `ogImage`, `heroImageAlt`, `faq`, `sources`. Dates are YYYY-MM-DD strings, not BSON Date objects. Each asset has `name`, `key`, `sha256`, `contentType`; keys must be under that exact article/version's `assets/` path. Names are SHA-256 plus png/jpg/jpeg/webp/gif/avif extension. Limits: 1 MiB Markdown, 20 MiB per image, 100 assets per article. The catalog currently caps public listing at 10,000 records; add pagination before approaching that scale.

An administrator must create a unique non-partial index on `slug` before import. Do not give bots index creation, deletion or database administration privileges.

## Least privilege

- Website Mongo user: `find` on exactly `healthos.content_catalog`.
- Migration/publisher Mongo user: `find`, `insert`, `update` on exactly that collection; the importer additionally requires `listIndexes` to verify the unique slug index. It rejects broad or unverifiable effective permissions before writing.
- Website S3 identity: `s3:GetObject` on `arn:aws:s3:::healthos-exp/seo-growth/articles/*` only.
- Migration identity: `s3:GetObject` and `s3:PutObject` on that same prefix only. No `DeleteObject`, `PutObjectAcl`, bucket policy changes or broad account access. ListBucket is not needed by this implementation. Add narrowly scoped KMS permissions only if the bucket's actual encryption requires them.
- The exposed research password must be rotated and its broad role removed before reuse. Research storage permissions do not automatically authorize publishing catalog updates.

Permissions are additive: inspect all attached Mongo roles and AWS policies, not just one narrow policy. The code enforces target paths but is not a substitute for provider-side permissions. Verify S3 scope with provider policy inspection; the migration script cannot prove effective IAM scope itself.

## Migration

### Catalog-first staging

`scripts/stage-blog-catalog.mjs` supports the explicitly authorized one-time MongoDB-only import. Its default is a local dry run. Running with `node --env-file=.env.local --experimental-strip-types scripts/stage-blog-catalog.mjs --apply` inserts only missing, deterministic draft records into `healthos.content_catalog` and verifies every field. It may use the existing frontend credential for this operator task only; runtime and bot permissions remain separate. Conflicting records are never overwritten.

Staged records have `status: "draft"` and `migration: { state: "pending_s3_upload", intendedStatus: "published" }` (or the original draft status). Their S3 keys describe planned objects, not uploaded files. Do not enable remote mode or delete local sources on the basis of catalog staging. The existing full importer deliberately rejects these differing draft records; completing migration requires a staged-record promotion step that verifies S3 bytes first and conditionally updates the exact staged record. Do not manually mark records published before that verification.

`scripts/complete-staged-blog-migration.mjs` implements that operator-only promotion. Default execution is a local dry run. With `node --env-file=.env.local --experimental-strip-types scripts/complete-staged-blog-migration.mjs --apply`, it uses the owner's explicitly authorized frontend MongoDB credential and the existing `../secrects/healthos-vercel-s3_accessKeys.csv` file (no credentials embedded in code). All article packages must match the exact staged or already-completed records. It conditionally creates S3 objects and verifies their bytes and content types before promoting any records. Promotion compares the complete staged document atomically to avoid overwriting concurrent edits. It does not change runtime credentials, website mode, IAM policies or local source files. These operator credentials must not be handed to bots. The scoped runtime/publisher setup below still applies.

Node 22.18+ is required for the standalone TypeScript model import. From `frontend/`:

```sh
npm run test:blog
npm run blog:migrate
```

The default is a local-only dry run: validates every existing article, resolves local referenced images in `public/`, generates deterministic versioned keys, rewrites media references, and reports bytes. No cloud calls. It refuses missing/unsupported/external media for manual review rather than silently producing an incomplete migration. The importer covers current Markdown image syntax, HTML img sources, hero and OG images; new embed/video/reference-image formats require importer support first.

After setting dedicated migration credentials securely, confirming provider scope and the unique slug index:

```sh
npm run blog:migrate -- --apply
```

Uploads assets, Markdown and a version manifest with conditional create-only S3 writes. Reads back and verifies all bytes before inserting the catalog record. Never overwrites an existing differing catalog row or object. Identical reruns resume safely. Partial failure can leave unreferenced version files; it does not delete or overwrite user content. All article packages are validated before remote writes. Existing records are checked before uploads.

Switch to remote only after verifying imported counts, slugs, metadata, rendered HTML and media against the originals. Test existing and new slugs, missing/draft 404s, cache invalidation, rollback and denied access outside the allowed resources. Keep source files until the migration is accepted.

## Bot publishing contract

This change provides rendering, a migration importer and cache invalidation—not an unrestricted publishing API or an activated GrokBot connection.

For future updates: write an immutable complete version + manifest, validate and approve it, then update the catalog pointer using compare-and-swap on the previous version. A draft for an already-live slug belongs in a separate draft/version workflow; do not replace the published record until approved. S3 manifests retain previous metadata for rollback. Give only the publishing worker catalog-update authority. It must not execute arbitrary bot-authored code.

After a successful publication or withdrawal, POST `/api/blog/revalidate/` with `Authorization: Bearer <BLOG_REVALIDATE_SECRET>` and JSON `{ "slug": "example-article" }`. This endpoint changes caches only, not content. It expires blog data and invalidates the article, index, sitemap and llms route. Refresh happens on the next request; a successful webhook is not proof of a verified live page. Fetch the public page/media and verify the intended version before distributing links. Use bounded retries and job IDs in the bot workflow.

The initial shared tag invalidates all cached blog data. At higher publication volume, introduce per-article tags while retaining a shared catalog tag. Use hosting rate limits for the webhook; never expose its secret to readers.
