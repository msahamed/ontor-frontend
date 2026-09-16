import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/app/components/Nav";
import BackLink from "../_components/BackLink";
import InstallFooter from "../_components/InstallFooter";
import { INSTALL_SHARED_CSS } from "../_lib/shared-css";
import { extractEmail, type SearchParams } from "../_lib/query";
import { IOS_LINK, isInvited } from "../_lib/gate";

// ── /install/ios: split out of the old combined /install page, same
// content and same stealth gate. Deliberately unlisted: noindex + not
// in the sitemap or site nav.

export const metadata: Metadata = {
  alternates: { canonical: "/install/ios/" },
  title: "Install Ontor for iPhone (beta)",
  description: "TestFlight setup steps for Ontor beta access on iPhone.",
  robots: { index: false, follow: false },
};

export default async function InstallIosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const email = await extractEmail(searchParams);
  const invited = email ? await isInvited(email) : false;
  const iosLink = invited ? (
    <a href={IOS_LINK} className="inst-link">{IOS_LINK.replace("https://", "")}</a>
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
              <h2>iPhone</h2>
              <p className="inst-note-wide">
                Goes through Apple&apos;s TestFlight. No invitation code is
                needed at any point.
              </p>
              <div className="inst-cols">
                <div className="inst-col">
                  <h3>Install</h3>
                  <ol className="inst-steps">
                    <li>
                      <strong>Open the invite link on your iPhone:</strong>
                      <br />
                      {iosLink}
                    </li>
                    <li>
                      <strong>Install TestFlight if asked.</strong> If you
                      don&apos;t have Apple&apos;s TestFlight app yet, the
                      link sends you to the App Store to install it first.
                      This is normal.
                    </li>
                    <li>
                      <strong>Come back and tap the link again.</strong> After
                      TestFlight finishes installing, return here and tap the
                      invite link a second time. It opens TestFlight straight
                      to Ontor.
                    </li>
                    <li>
                      <strong>Tap Accept, then Install.</strong> You&apos;ll
                      see Ontor with an Accept and an Install button. Tap them
                      and you&apos;re in.
                    </li>
                  </ol>
                  <div className="inst-warn">
                    If you see a <strong>&ldquo;Redeem Code&rdquo;</strong>{" "}
                    box asking for an invitation code, don&apos;t type
                    anything. That screen just means TestFlight was opened on
                    its own. Close it, come back to the invite link above, and
                    tap it again &mdash; you never need a code.
                  </div>
                </div>

                <div className="inst-col">
                  <h3>Update</h3>
                  <p className="inst-note">
                    We ship new builds often during beta. Takes about 30
                    seconds:
                  </p>
                  <ol className="inst-steps">
                    <li>
                      On your iPhone, open the <strong>TestFlight</strong> app.
                    </li>
                    <li>
                      Tap <strong>Ontor</strong> in your list.
                    </li>
                    <li>
                      Tap <strong>Update</strong>. If it says Open instead,
                      you&apos;re already on the latest build.
                    </li>
                    <li>
                      Optional: turn on <strong>Automatic Updates</strong> on
                      that same page and future builds install themselves.
                    </li>
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
