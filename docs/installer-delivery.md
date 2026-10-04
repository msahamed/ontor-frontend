# Direct S3 installer delivery

The download namespaces in `next.config.ts` now issue temporary 307 redirects
to the existing `ontor-releases` S3 bucket. Installer and updater bytes go from
S3 to the client; Vercel only handles the redirect. AWS request and transfer
usage still applies. This change is not bot protection.

The buttons and first-party URLs stay the same. Next passes through query
parameters, including `acquisition_id`. Windows remains under the bucket's
existing `mac/windows/` prefix.

## Release order

1. Build, sign, notarize and publish the Mac app containing the updated
   `macos/Runner/DownloadAttribution.swift` reader in `mobile_app`. It accepts
   either the existing first-party URL or the exact S3 Mac installer URL.
   Publish this installer before deploying the website redirects: older
   readers may lose attribution if the browser records the final S3 URL.
2. Test a fresh download/install through a redirect in Safari and Chrome on
   Mac, and Edge or Chrome on Windows. Confirm acquisition metadata is read
   without changing the app's private user ID. Windows already extracts the
   ID from download metadata without requiring the first-party hostname;
   no Windows installer code change is required for the new hostname.
3. Check Sparkle and the Windows updater can follow the redirected feeds
   and artifact URLs, retaining their existing signature checks.
4. Deploy the frontend, then verify live URLs return 307 with the expected
   S3 Location and preserved acquisition ID. Confirm S3 returns 200 and
   supports Range requests. Avoid fetching entire installers for monitoring.
5. Compare Vercel download-route transfer before/after and inspect AWS usage.
   Historical Vercel usage will not disappear after deployment.

## Local verification

`node --experimental-strip-types --test tests/download-redirects.test.mjs`
checks the real Next configuration routing, including installers, update
feeds, versioned files, delta files and query preservation.

The native tests in `mobile_app/test/native/download_attribution_test.swift`
cover both URL sources, quarantine/Where Froms handoff, and rejection of
untrusted hosts, wrong paths, invalid IDs and duplicate IDs.

These checks do not substitute for a signed release and actual browser
installation tests on both operating systems.

## Rollback

Restore the previous `rewrites()` configuration and redeploy the frontend.
The Mac reader remains compatible with the previous first-party URLs.
