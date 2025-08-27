/** @type {import('next').NextConfig} */
const nextConfig = {
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
  }
};

module.exports = nextConfig;