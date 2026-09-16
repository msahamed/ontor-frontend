import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/app/components/Nav";
import BackLink from "../_components/BackLink";
import InstallFooter from "../_components/InstallFooter";
import { INSTALL_SHARED_CSS } from "../_lib/shared-css";
import { extractEmail, type SearchParams } from "../_lib/query";
import { ANDROID_LINK, isInvited } from "../_lib/gate";

// ── /install/android: split out of the old combined /install page,
// same content and same stealth gate. Deliberately unlisted: noindex +
// not in the sitemap or site nav.

export const metadata: Metadata = {
  alternates: { canonical: "/install/android/" },
  title: "Install Ontor for Android (beta)",
  description: "Play Store tester setup steps for Ontor beta access on Android.",
  robots: { index: false, follow: false },
};

export default async function InstallAndroidPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const email = await extractEmail(searchParams);
  const invited = email ? await isInvited(email) : false;
  const accountName = email ? (
    <strong className="inst-email">{email}</strong>
  ) : (
    <strong>the email your invite was sent to</strong>
  );
  const androidLink = invited ? (
    <a href={ANDROID_LINK} className="inst-link">
      play.google.com/apps/internaltest/&hellip;
    </a>
  ) : (
    <em className="inst-locked">use the install link from your invite email</em>
  );

  return (
    <>
      <Nav />

      <main id="top" className="flex-1">
        <BackLink email={email} />

        <div className="inst-body" style={{ paddingTop: 0 }}>
          <div className="inst-wrap">
            {!invited && (
              <div className="inst-gate">
                Ontor is in private beta, so the install link only shows up
                when you open this page from your invite email. Not invited
                yet? <Link href="/#join">Join the waitlist</Link> and
                we&apos;ll reach out when your spot opens.
              </div>
            )}

            <div className="inst-card">
              <h2>Android</h2>
              <p className="inst-note-wide">
                The key thing for both install and updates: your
                phone&apos;s Play Store must be signed into {accountName}.
                That&apos;s the account we added as a tester, and the link
                only works for it.
              </p>
              <div className="inst-cols">
                <div className="inst-col">
                  <h3>Install</h3>
                  <ol className="inst-steps">
                    <li>
                      On your Android phone, open the{" "}
                      <strong>Play Store</strong> app.
                    </li>
                    <li>
                      Tap your <strong>profile picture</strong> (top-right
                      corner).
                    </li>
                    <li>
                      <strong>Check the email shown there.</strong> It must be{" "}
                      {accountName}. If it shows a different one, tap it and
                      switch accounts.
                    </li>
                    <li>
                      <strong>Now open this link on the phone:</strong>
                      <br />
                      {androidLink}
                    </li>
                    <li>
                      On that page, tap{" "}
                      <strong>&ldquo;Become a tester&rdquo;</strong> (or
                      Accept).
                    </li>
                    <li>
                      <strong>Wait about 5&ndash;10 minutes.</strong> Google
                      needs a moment to activate it.
                    </li>
                    <li>
                      Go back to that same link and tap{" "}
                      <strong>&ldquo;Download it on Google Play&rdquo;</strong>{" "}
                      &rarr; Install.
                    </li>
                    <li>Open Ontor.</li>
                  </ol>
                  <div className="inst-warn">
                    Still says <strong>&ldquo;not available&rdquo;</strong>?
                    It&apos;s almost always the wrong email. Double-check step
                    3, wait a few more minutes, and try again. If your invite
                    went to a different address than your Play Store account,
                    reply to the invite email with the Gmail you actually use
                    on the phone and we&apos;ll add it.
                  </div>
                </div>

                <div className="inst-col">
                  <h3>Update</h3>
                  <p className="inst-note">
                    Getting the latest build takes about a minute:
                  </p>
                  <ol className="inst-steps">
                    <li>
                      Open the <strong>Play Store</strong>, tap your{" "}
                      <strong>profile circle</strong> (top right), and make
                      sure it shows {accountName}. If not, switch to that
                      account.
                    </li>
                    <li>
                      <strong>Tap this link on your phone:</strong>
                      <br />
                      {androidLink}
                    </li>
                    <li>
                      If it asks, tap{" "}
                      <strong>&ldquo;Become a tester&rdquo;</strong>, then{" "}
                      <strong>&ldquo;Download it on Google Play&rdquo;</strong>.
                    </li>
                    <li>
                      On the Ontor page, tap <strong>Update</strong> (or
                      Install).
                    </li>
                    <li>Open Ontor &mdash; you&apos;re on the latest build.</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="inst-help">
              Stuck on any step? Reply to your invite email &mdash; a human
              (Sabber) reads every one and will get you set up.
            </div>
          </div>
        </div>
      </main>

      <InstallFooter />

      <style>{INSTALL_SHARED_CSS}</style>
    </>
  );
}
