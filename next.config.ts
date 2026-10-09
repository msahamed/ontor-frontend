import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  // Sparkle has been verified with direct S3 delivery on macOS.
  async redirects() {
    return [{
      source: "/downloads/mac/Ontor.dmg",
      destination: "/install/mac/",
      permanent: false,
    }, {
      source: "/downloads/windows/Ontor.exe",
      destination: "/install/windows/",
      permanent: false,
    }, {
      source: "/downloads/mac/:path*",
      destination: "https://ontor-releases.s3.us-east-2.amazonaws.com/mac/:path*",
      permanent: false,
    }];
  },
  // Preserve the first-party transport used by installed Windows updaters.
  // Keep this compatibility route until redirect delivery is verified there.
  async rewrites() {
    return [{
      source: "/downloads/windows/:path*",
      destination: "https://ontor-releases.s3.us-east-2.amazonaws.com/mac/windows/:path*",
    }];
  },
};

export default withBotId(nextConfig);
