import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    // Next 16 only allows quality 75 by default; we use a slightly higher
    // quality for full-bleed hero photography.
    qualities: [75, 85],
  },
};

export default nextConfig;
