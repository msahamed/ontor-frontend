"use client";

import type { ReactNode } from "react";
import {
  getWebsiteUserId,
  newDownloadId,
  trackWebsiteFunnelEvent,
} from "@/lib/website-analytics";

type Props = {
  href: string;
  className: string;
  platform: "macos" | "windows";
  fileName: string;
  children: ReactNode;
};

export default function DownloadLink({
  href,
  className,
  platform,
  fileName,
  children,
}: Props) {
  return (
    <a
      className={className}
      href={href}
      onClick={(event) => {
        const visitorId = getWebsiteUserId();
        const downloadId = newDownloadId();
        const url = new URL(href, window.location.href);
        if (downloadId) url.searchParams.set("acquisition_id", downloadId);
        const downloadHref = url.toString();
        // Each download gets its own public journey ID. The app keeps a
        // separate private data ID; visitor_id links the earlier page view.
        event.currentTarget.href = downloadHref;
        trackWebsiteFunnelEvent("installer_download", {
          platform,
          ...(downloadId ? { userId: downloadId } : {}),
          props: {
            file_name: fileName,
            link_url: downloadHref,
            visitor_id: visitorId,
            ...(downloadId ? { acquisition_id: downloadId } : {}),
            transport_type: "beacon",
          },
        });
      }}
    >
      {children}
    </a>
  );
}
