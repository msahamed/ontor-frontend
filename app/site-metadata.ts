export const SITE_TITLE = "Ontor: Real-time voice feedback while you speak";
export const SITE_DESCRIPTION = "See how your voice changes during demanding conversations, with cues when a reset may help, so you can work under pressure with confidence.";
export const SOCIAL_IMAGE = {
  url: "/og-voice.png",
  width: 1200,
  height: 630,
  alt: "Ontor: Real-time voice feedback while you speak. On-device analysis. Optional cloud backup.",
};
export const SOCIAL_GRAPH = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  siteName: "Ontor",
  type: "website" as const,
  images: [SOCIAL_IMAGE],
};
