export const SITE_TITLE = "Ontor: Smart breaks for healthy computer work";
export const SITE_DESCRIPTION = "Ontor learns how you interact with your computer to notice changes in your focus and work rhythm, then suggests a short break or simple exercise when it may help. On-device analysis with optional cloud backup.";
export const SOCIAL_IMAGE = {
  url: "/og-smart-breaks.png",
  width: 1200,
  height: 630,
  alt: "Ontor: Smart breaks for healthy computer work. On-device analysis. Optional cloud backup.",
};
export const SOCIAL_GRAPH = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  siteName: "Ontor",
  type: "website" as const,
  images: [SOCIAL_IMAGE],
};
