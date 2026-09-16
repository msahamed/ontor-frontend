import type { Metadata } from "next";
import Nav from "@/app/components/Nav";
import BackLink from "../_components/BackLink";
import InstallFooter from "../_components/InstallFooter";
import DownloadLink from "../_components/DownloadLink";
import { DownloadIcon } from "../_components/icons";
import { INSTALL_SHARED_CSS } from "../_lib/shared-css";
import { extractEmail, type SearchParams } from "../_lib/query";

const WINDOWS_INSTALLER_URL =
  "https://ontor.ai/downloads/windows/Ontor-Setup.exe";

export const metadata: Metadata = {
  alternates: { canonical: "/install/windows/" },
  title: "Install Ontor for Windows",
  description: "Download the Ontor desktop beta for Windows.",
};

export default async function InstallWindowsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const email = await extractEmail(searchParams);

  return (
    <>
      <Nav />

      <main id="top" className="flex-1">
        <BackLink email={email} />

        <div className="inst-header">
          <span className="inst-badge is-live">Beta available</span>
          <h1 className="font-serif-display">Install Ontor for Windows.</h1>
          <p>One installer. No invite needed.</p>
        </div>

        <div className="wn-dl">
          <DownloadLink
            className="wn-dl-btn"
            href={WINDOWS_INSTALLER_URL}
            platform="windows"
            fileName="Ontor-Setup.exe"
          >
            <DownloadIcon /> Download Ontor for Windows
          </DownloadLink>
          <span className="wn-dl-meta">Ontor-Setup.exe &middot; unsigned beta</span>
        </div>

        <div className="inst-wrap">
          <div className="wn-steps">
            <div className="wn-step">
              <span className="wn-step-n">Step 1</span>
              <p><strong>Open Ontor-Setup.exe.</strong> Find it in Downloads and double-click it.</p>
            </div>
            <div className="wn-step">
              <span className="wn-step-n">Step 2</span>
              <p><strong>If SmartScreen appears, choose More info.</strong> Then select Run anyway. This beta is not digitally signed yet.</p>
            </div>
            <div className="wn-step">
              <span className="wn-step-n">Step 3</span>
              <p><strong>Finish installation.</strong> Ontor opens and remains available from the system tray.</p>
            </div>
          </div>
          <div className="wn-req">Requires 64-bit Windows 10 or later.</div>
        </div>
      </main>

      <InstallFooter />

      <style>{INSTALL_SHARED_CSS + WINDOWS_CSS}</style>
    </>
  );
}

const WINDOWS_CSS = `
.wn-dl { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 22px 32px 6px; }
.wn-dl-btn {
  background: var(--teal); color: #fff; border-radius: 12px; padding: 15px 30px;
  font-size: 15.5px; font-weight: 700; text-decoration: none; display: inline-flex;
  align-items: center; gap: 10px; box-shadow: 0 10px 24px -12px rgba(15,118,110,.5);
}
.wn-dl-meta { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: var(--ink-soft); }
.wn-steps { padding: 30px 0 8px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.wn-step { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 18px 16px; }
.wn-step-n {
  font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
  color: #B45309; background: var(--amber-soft); border: 1px solid var(--amber-border);
  border-radius: 999px; padding: 2px 9px; display: inline-block; margin-bottom: 10px;
}
.wn-step p { margin: 0; font-size: 13.5px; color: var(--ink-soft); line-height: 1.55; }
.wn-step strong { color: var(--ink); }
.wn-req { margin: 20px 0 26px; text-align: center; font-size: 12px; color: var(--ink-soft); }

@media (max-width: 700px) { .wn-steps { grid-template-columns: 1fr; } }
`;
