"use client";

import type { ReactNode } from "react";
import {
  getWebsiteUserId,
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
        const acquisitionId = getWebsiteUserId();
        let downloadHref = href;
        if (platform === "windows") {
          const url = new URL(href);
          url.searchParams.set("acquisition_id", acquisitionId);
          downloadHref = url.toString();
          // Set the destination synchronously so this same click downloads the
          // tagged installer. The filename remains the friendly Ontor.exe.
          event.currentTarget.href = downloadHref;
        }
        trackWebsiteFunnelEvent("installer_download", {
          platform,
          props: {
            file_name: fileName,
            link_url: downloadHref,
            acquisition_id: acquisitionId,
            transport_type: "beacon",
          },
        });
      }}
    >
      {children}
    </a>
  );
}
