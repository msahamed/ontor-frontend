"use client";

import type { ReactNode } from "react";
import { trackWebsiteEvent } from "@/lib/website-analytics";

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
      onClick={() =>
        trackWebsiteEvent("installer_download", {
          platform,
          file_name: fileName,
          page_path: window.location.pathname,
          link_url: href,
          transport_type: "beacon",
        })
      }
    >
      {children}
    </a>
  );
}

