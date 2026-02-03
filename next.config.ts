import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.intra.42.fr",
        pathname: "/users/**",
      },
    ],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
