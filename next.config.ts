import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  // Keep stable download/update URLs, but let S3 deliver the file bytes.
  // Temporary redirects allow future release-host changes. Next preserves
  // query parameters, including acquisition_id. Publish the S3-compatible
  // macOS attribution reader before deploying this delivery change.
  async redirects() {
    return [
      {
        source: "/downloads/mac/:path*",
        destination:
          "https://ontor-releases.s3.us-east-2.amazonaws.com/mac/:path*",
        permanent: false,
      },
      {
        source: "/downloads/windows/:path*",
        destination:
          "https://ontor-releases.s3.us-east-2.amazonaws.com/mac/windows/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
