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

  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL;
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
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
