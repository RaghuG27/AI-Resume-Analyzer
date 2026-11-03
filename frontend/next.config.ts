import type { NextConfig } from "next";

const API_URL = process.env.API_URL;

if (!API_URL) {
  throw new Error("API_URL is not configured");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL.replace(/\/+$/, "")}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;