const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Set the correct workspace root for Vercel
  outputFileTracingRoot: path.join(__dirname),
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
  
  // Webpack configuration with explicit alias resolution
  webpack: (config, { dev, isServer }) => {
    // Explicitly set up @ alias for module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    
    // Memory optimizations for development
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
      
      // Reduce memory usage in development
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Limit parallel builds to reduce memory
      config.parallelism = 2;
    }
    
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
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://epartstaging.wpengine.com https://thompsons-eparts.com https://*.wpengine.com"
          },
        ],
      },
      // Ensure Next.js static CSS is served with the correct MIME type
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Ensure Next.js JS chunks are served with the correct MIME type
      {
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
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

  // Output standalone for Docker only (not on Vercel)
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
};

module.exports = nextConfig;
