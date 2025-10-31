// project/next.config.ts
import path from "path";

/** @type {import('next').NextConfig} */
const isPlayer = process.env.PLAYER === "true";

const nextConfig = {
  // reactStrictMode: true,
  reactStrictMode: false,
  basePath: isPlayer ? "" : "",
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://dev-cms-production.up.railway.app/api/:path*",
          // "http://localhost:8080/api/:path*",
      },
    ];
  },
  webpack: (config: any) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
};

export default nextConfig;
