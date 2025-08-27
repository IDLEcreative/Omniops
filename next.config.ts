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
  },
  typescript: {
    // Skip TypeScript checking during Docker build
    ignoreBuildErrors: true
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Set output file tracing root to fix the warning
  outputFileTracingRoot: '/Users/jamesguy/Customer Service Agent/customer-service-agent'
};

export default nextConfig;
