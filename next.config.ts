import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress hydration warnings in development
  reactStrictMode: true,
  // Optionally disable powered by header
  poweredByHeader: false,
  // Handle image domains if needed
  images: {
    domains: [],
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
