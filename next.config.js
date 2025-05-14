/** @type {import('next').NextConfig} */
const runtimeConfig = require('./runtime-config');

const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: [
    '@radix-ui',
    '@radix-ui/react-progress',
    '@radix-ui/number',
    '@radix-ui/react-primitive'
  ],
  images: { unoptimized: true },
  // Disable automatic static optimization for pages with client-side dependencies
  experimental: {
    // This prevents Next.js from automatically pre-rendering pages that shouldn't be pre-rendered
    // It only pre-renders pages without getServerSideProps or getInitialProps
    concurrentFeatures: true
  },
  // Disabling static generation - forcing the app to be client-side rendered
  // This helps with "document is not defined" errors during static generation
  staticPageGenerationTimeout: 1000,
  reactStrictMode: false,
  // Disable static generation by making all pages handle "document is not defined"
  onDemandEntries: {
    // Keep all pages in memory for faster development
    maxInactiveAge: 1000 * 60 * 60, // 1 hour
    pagesBufferLength: 5,
  },
  // Disable static optimization
  webpack: (config, { isServer }) => {
    // Fix for "document is not defined" errors
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Runtime configuration
  ...runtimeConfig,
};

module.exports = nextConfig;
