"use client";

import { useRef, useState, type ReactNode } from "react";
import { getWebsiteUserId, newDownloadId, trackWebsiteFunnelEvent } from "@/lib/website-analytics";

type Props = {
  href: string;
  className: string;
  platform: "macos" | "windows";
  fileName: string;
  children: ReactNode;
};

export default function DownloadLink({ className, platform, fileName, children }: Props) {
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <>
    <button type="button" className={className} disabled={busy} aria-busy={busy}
      style={{ fontFamily: "inherit", cursor: busy ? "wait" : "pointer" }}
      onClick={async () => {
        if (pending.current) return;
        pending.current = true;
        setBusy(true);
        setError("");
        try {
          const downloadId = newDownloadId();
          const response = await fetch("/api/download/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform, acquisitionId: downloadId }),
            signal: AbortSignal.timeout(20000),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "Download unavailable. Please try again.");
          trackWebsiteFunnelEvent("installer_download", {
            platform,
            ...(downloadId ? { userId: downloadId } : {}),
            props: { file_name: fileName, link_url: result.url, visitor_id: getWebsiteUserId(),
              ...(downloadId ? { acquisition_id: downloadId } : {}), transport_type: "beacon" },
          });
          window.location.assign(result.url);
        } catch (err) {
          setError(err instanceof Error && err.name !== "TimeoutError" && err.name !== "TypeError"
            ? err.message : "Couldn’t start the download. Please try again.");
        } finally {
          pending.current = false;
          setBusy(false);
        }
      }}>{busy ? "Preparing download…" : children}</button>
    {error && <span role="alert" style={{ display: "block", flexBasis: "100%", fontSize: 14 }}>{error} <a href="mailto:sabber@ontor.ai">Get help</a></span>}
    <noscript><span>Enable JavaScript to download Ontor.</span></noscript>
  </>;
}
