import Nav from "../components/Nav";
import Link from "next/link";
import type { Metadata } from "next";
import { getSessionFromCookies } from "@/lib/auth";
import { extractEmail, withEmail, type SearchParams } from "./_lib/query";
import { INSTALL_SHARED_CSS } from "./_lib/shared-css";
import DownloadLink from "./_components/DownloadLink";
import InstallFooter from "./_components/InstallFooter";
import { LaptopIcon, DownloadIcon, WindowsIcon } from "./_components/icons";

export const metadata: Metadata = {
  alternates: { canonical: "/install/" },
  title: "Install Ontor",
  description: "Download Ontor for Mac or Windows. Try it free for 14 days, with no card required.",
};

export default async function InstallChooserPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const email = await extractEmail(searchParams);
  const params = await searchParams;
  const trialStarted = params.trial === "started";
  const session = await getSessionFromCookies();
  const link = (path: string) => withEmail(path, email);

  return (
    <>
      <Nav />

      <main id="top" className="flex-1">
        <section className="ch-hero">
          <div className="inst-wrap">
            <h1 className="font-serif-display">Install Ontor.</h1>
            <p>
              See your voice signals during conversations and try a short reset when they shift.
            </p>
            <p className="ch-trial-note">14 days free. No card required.</p>
          </div>
        </section>

        <section className="inst-body">
          <div className="inst-wrap">
            {trialStarted && session && (
              <div className="ch-trial-started" role="status">
                <strong>Your 14-day trial has started.</strong>
                <span>Install Ontor on this computer, or continue to your account.</span>
              </div>
            )}
            <div className="ch-primary" aria-label="Desktop downloads">
              <article className="ch-platform">
                <div className="ch-platform-heading">
                  <span className="ch-icon" aria-hidden="true"><LaptopIcon /></span>
                  <div><h2>Mac</h2><p>macOS 14 or later · Apple silicon and Intel</p></div>
                </div>
                <DownloadLink className="ch-download" href="https://ontor.ai/downloads/mac/Ontor.dmg" platform="macos" fileName="Ontor.dmg">
                  <DownloadIcon /> Download for Mac
                </DownloadLink>
                <p className="ch-setup">Open the .dmg and drag Ontor into Applications. Notarized by Apple.</p>
                <Link className="ch-help" href={link("/install/mac")}>Mac setup instructions</Link>
              </article>
              <article className="ch-platform">
                <div className="ch-platform-heading">
                  <span className="ch-icon" aria-hidden="true"><WindowsIcon /></span>
                  <div><h2>Windows <span className="ch-beta">Beta</span></h2><p>64-bit Windows 10 or later</p></div>
                </div>
                <DownloadLink className="ch-download" href="https://ontor.ai/downloads/windows/Ontor-Setup.exe" platform="windows" fileName="Ontor-Setup.exe">
                  <DownloadIcon /> Download for Windows
                </DownloadLink>
                <p className="ch-setup">Open the .exe to install. This beta is unsigned, so Windows may show a SmartScreen prompt.</p>
                <Link className="ch-help" href={link("/install/windows")}>Windows setup instructions</Link>
              </article>
            </div>

            {session && (
              <Link className="ch-dashboard-link" href="/dashboard/">
                Continue to dashboard
              </Link>
            )}

            <details className="ch-mobile">
              <summary>Invited to test on mobile?</summary>
              <p>Use the email address from your invitation to open your setup instructions.</p>
              <div><Link href={link("/install/ios")}>iPhone setup</Link><Link href={link("/install/android")}>Android setup</Link></div>
            </details>
          </div>
        </section>
      </main>

      <InstallFooter />

      <style>{INSTALL_SHARED_CSS + CHOOSER_CSS}</style>
    </>
  );
}

const CHOOSER_CSS = `
.ch-hero { padding: 64px 0 32px; background: var(--paper); }
.ch-hero h1 { margin: 0; color: var(--ink); font-size: clamp(40px, 5.4vw, 60px); font-weight: 800; line-height: 1.08; letter-spacing: -.034em; }
.ch-hero p { max-width: 580px; margin: 18px 0 0; color: var(--ink-soft); font-size: 18px; line-height: 1.55; }
.ch-hero .ch-trial-note { margin-top: 12px; color: var(--teal-dark); font-size: 15px; font-weight: 600; }
.inst-body { padding: 0 0 72px; background: var(--paper); }
.ch-trial-started { display: flex; flex-direction: column; gap: 4px; margin-bottom: 20px; padding: 16px 20px; border-radius: 10px; background: var(--teal-surface); color: var(--teal-dark); font-size: 14px; }
.ch-primary { border: 1px solid var(--line); border-radius: 14px; background: #fff; overflow: hidden; }
.ch-platform { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px 24px; padding: 28px; }
.ch-platform + .ch-platform { border-top: 1px solid var(--line); }
.ch-platform-heading { display: flex; align-items: center; gap: 16px; }
.ch-icon { display: grid; flex-shrink: 0; width: 44px; height: 44px; place-items: center; color: var(--teal); }
.ch-platform h2 { margin: 0; font-size: 24px; font-weight: 750; letter-spacing: -.02em; }
.ch-platform-heading p { margin: 4px 0 0; color: var(--ink-soft); font-size: 14px; line-height: 1.5; }
.ch-beta { margin-left: 6px; color: var(--ink-soft); font-size: 13px; font-weight: 500; letter-spacing: normal; }
.ch-download { display: inline-flex; align-items: center; justify-content: center; align-self: center; gap: 9px; min-height: 48px; padding: 12px 20px; border-radius: 9px; background: var(--teal); color: #fff; font-size: 15px; font-weight: 700; text-decoration: none; }
.ch-download:hover { background: var(--teal-dark); }
.ch-download:focus-visible, .ch-help:focus-visible, .ch-mobile summary:focus-visible { outline: 3px solid var(--amber); outline-offset: 4px; }
.ch-setup { grid-column: 1 / -1; margin: 4px 0 0 60px; max-width: 650px; color: var(--ink-soft); font-size: 14px; line-height: 1.6; }
.ch-help { grid-column: 1 / -1; justify-self: start; margin-left: 60px; color: var(--teal); font-size: 14px; text-underline-offset: 3px; }
.ch-dashboard-link { display: inline-block; margin-top: 20px; color: var(--teal); font-size: 14px; font-weight: 700; }
.ch-mobile { margin-top: 28px; color: var(--ink-soft); font-size: 14px; }
.ch-mobile summary { cursor: pointer; width: fit-content; padding: 8px 0; }
.ch-mobile p { margin: 8px 0 12px; line-height: 1.6; }
.ch-mobile > div { display: flex; gap: 24px; }
.ch-mobile a { color: var(--teal); text-underline-offset: 3px; }
@media (max-width: 640px) {
  .ch-hero { padding-top: 40px; }
  .ch-hero p { font-size: 17px; }
  .ch-platform { grid-template-columns: minmax(0, 1fr); padding: 22px 20px; gap: 14px; }
  .ch-download { width: 100%; }
  .ch-setup, .ch-help { margin-left: 0; }
}
`;
