This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Website installer guardrail

Download buttons POST to `/api/download/`, protected by Vercel BotID (basic mode)
and a shared Mongo rate limit of 20 requests per IP per ten minutes. No login or
visible CAPTCHA is required. Verification failures return a retryable error;
the existing rate limiter fails open if Mongo is unavailable. Acquisition events
are recorded after verification succeeds, rather than on every button click.

The unversioned installer aliases redirect to install pages. Versioned releases,
appcasts, and update deltas retain their existing delivery paths. S3 objects are
still public, so this protects the website flow, not direct bucket requests.
Closing that remaining path requires a separate release-storage/updater change.

BotID bypasses classification in local development. On a Vercel preview, verify
one browser download and confirm that a plain POST without BotID headers is
rejected before promoting to production. No Turnstile keys are needed.

Run the download regression tests:

```sh
node --experimental-strip-types --test tests/installer-download.test.mjs tests/download-redirects.test.mjs
```
