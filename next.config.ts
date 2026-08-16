import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "2sgroup.vn",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
