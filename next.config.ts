import type { NextConfig } from "next";

function supabaseImagePattern() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return null;
    const parsed = new URL(url);
    return {
      protocol: (parsed.protocol === "http:" ? "http" : "https") as
        | "http"
        | "https",
      hostname: parsed.hostname,
      port: parsed.port || undefined,
      pathname: "/storage/v1/object/public/**" as const,
    };
  } catch {
    return null;
  }
}

const supabasePattern = supabaseImagePattern();

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@phosphor-icons/react"],
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.intra.42.fr",
        pathname: "/users/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/avatars/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/embed/avatars/**",
      },
      ...(supabasePattern ? [supabasePattern] : []),
    ],
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
