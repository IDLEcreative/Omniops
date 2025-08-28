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
  },
  
  // Performance optimizations (swcMinify is now default in Next.js 13+)
  
  // Optimize production builds
  productionBrowserSourceMaps: false, // Disable source maps in production
  
  // Experimental features for better performance
  experimental: {
    // optimizeCss disabled to avoid critters dependency issue
    scrollRestoration: true, // Better scroll restoration  
  },
  
  // Simplified webpack configuration
  webpack: (config) => {
    // Keep it simple to avoid build issues
    return config;
  },
  
  // Headers for caching static assets
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
      {
        source: '/(.*)\\.(js|css|woff|woff2|ttf|otf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)\\.(jpg|jpeg|png|gif|ico|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
  
  // Compression
  compress: true,
  
  // Output standalone for Docker
  output: 'standalone',
};

module.exports = nextConfig;