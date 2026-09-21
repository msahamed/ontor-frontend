import type { Metadata } from "next";
import Nav from "@/app/components/Nav";
import BackLink from "../_components/BackLink";
import InstallFooter from "../_components/InstallFooter";
import DownloadLink from "../_components/DownloadLink";
import { DownloadIcon, RefreshIcon } from "../_components/icons";
import { INSTALL_SHARED_CSS } from "../_lib/shared-css";
import { extractEmail, type SearchParams } from "../_lib/query";

// ── /install/mac: the first fully public install surface. No gate, no
// Mongo lookup, renders the same for every visitor — an incoming
// ?email= (from the chooser or an invite link) is accepted but simply
// unused here. Ontor.dmg is the evergreen "latest" filename served via
// the /downloads/mac/* rewrite in next.config.ts (never a versioned
// name — that rewrite is the stable URL baked into shipped apps).

const MAC_DMG_URL = "https://ontor.ai/downloads/mac/Ontor.dmg";

export const metadata: Metadata = {
  alternates: { canonical: "/install/mac/" },
  title: "Install Ontor for Mac",
  description:
    "Download Ontor for Mac. One .dmg, drag it into Applications, and you're set. Notarized by Apple, updates itself.",
  openGraph: {
    title: "Install Ontor for Mac",
    description:
      "Download Ontor for Mac. One .dmg, drag it into Applications, and you're set. Notarized by Apple, updates itself.",
    url: "https://ontor.ai/install/mac/",
  },
};

export default async function InstallMacPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Silently dropped: Mac has no gate, this is only kept so the "All
  // platforms" breadcrumb can still forward it back to the chooser.
  const email = await extractEmail(searchParams);

  return (
    <>
      <Nav />

      <main id="top" className="flex-1">
        <BackLink email={email} />

        <div className="inst-header">
          <span className="inst-badge is-live">Available now</span>
          <h1 className="font-serif-display">Install Ontor for Mac.</h1>
          <p>One download. Drag it in. You&apos;re set.</p>
        </div>

        <div className="mc-dl">
          <DownloadLink
            className="mc-dl-btn"
            href={MAC_DMG_URL}
            platform="macos"
            fileName="Ontor.dmg"
          >
            <DownloadIcon /> Download Ontor for Mac
          </DownloadLink>
          <span className="mc-dl-meta">Ontor.dmg &middot; notarized</span>
        </div>

        <div className="inst-wrap">
          <div className="mc-steps">
            <div className="mc-step">
              <span className="mc-step-n">Step 1</span>
              <p><strong>Open the .dmg.</strong> Find it in Downloads and double-click it.</p>
            </div>
            <div className="mc-step">
              <span className="mc-step-n">Step 2</span>
              <p><strong>Drag Ontor into Applications.</strong> That&apos;s the whole install.</p>
            </div>
            <div className="mc-step">
              <span className="mc-step-n">Step 3</span>
              <p><strong>First open, click &ldquo;Open.&rdquo;</strong> macOS checks the download once and asks you to confirm.</p>
            </div>
          </div>

          <div className="mc-quiet">
            <RefreshIcon /> Ontor keeps itself up to date automatically.
          </div>
          <div className="mc-req">Requires macOS 14 or later. Works on Apple silicon and Intel.</div>
        </div>
      </main>

      <InstallFooter />

      <style>{INSTALL_SHARED_CSS + MAC_CSS}</style>
    </>
  );
}

const MAC_CSS = `
.mc-dl { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 22px 32px 6px; }
.mc-dl-btn {
  background: var(--teal); color: #fff; border: none; border-radius: 12px;
  padding: 15px 30px; font-size: 15.5px; font-weight: 700; text-decoration: none; display: inline-flex;
  align-items: center; gap: 10px; box-shadow: 0 10px 24px -12px rgba(15,118,110,.5);
}
.mc-dl-meta { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; color: var(--ink-soft); }

.mc-steps { padding: 30px 0 8px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.mc-step { background: #fff; border: 1px solid var(--line); border-radius: 12px; padding: 18px 18px 16px; }
.mc-step-n {
  font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: #B45309; background: var(--amber-soft); border: 1px solid var(--amber-border);
  border-radius: 999px; padding: 2px 9px; display: inline-block; margin-bottom: 10px;
}
.mc-step p { margin: 0; font-size: 13.5px; color: var(--ink-soft); line-height: 1.55; }
.mc-step strong { color: var(--ink); }

.mc-quiet {
  margin: 20px 0 0; text-align: center; font-size: 13px; color: var(--ink-soft);
  display: flex; align-items: center; justify-content: center; gap: 7px;
}
.mc-req { margin: 12px 0 26px; text-align: center; font-size: 12px; color: var(--ink-soft); }

@media (max-width: 700px) { .mc-steps { grid-template-columns: 1fr; } }
`;
