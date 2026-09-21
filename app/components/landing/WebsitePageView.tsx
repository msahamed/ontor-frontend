"use client";

import { useEffect } from "react";
import { trackWebsitePageViewOnce } from "@/lib/website-analytics";

/** Fires one website_page_view into GA4/FS/Mongo per path per tab session. */
export default function WebsitePageView({ pageName = "landing" }: { pageName?: string }) {
  useEffect(() => {
    trackWebsitePageViewOnce(pageName);
  }, [pageName]);

  return null;
}
