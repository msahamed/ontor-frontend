"use client";

import type { ReactNode } from "react";
import { trackWebsiteFunnelEvent } from "@/lib/website-analytics";

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
        trackWebsiteFunnelEvent("installer_download", {
          platform,
          props: {
            file_name: fileName,
            link_url: href,
            transport_type: "beacon",
          },
        })
      }
    >
      {children}
    </a>
  );
}
