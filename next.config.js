/** @type {import('next').NextConfig} */
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
};

module.exports = nextConfig;
