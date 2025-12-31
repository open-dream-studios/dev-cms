// project/next.config.ts
import path from "path";
import type { NextConfig } from "next";

const isPlayer = process.env.PLAYER === "true";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  basePath: isPlayer ? "" : "",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
    ],
  },

  experimental: { 
    externalDir: true,
  },

  turbopack: {
    resolveAlias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    config.resolve.symlinks = true;
    return config;
  },
};

export default nextConfig;
