import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Ensure proper static file serving
  trailingSlash: true,
};

export default nextConfig;
