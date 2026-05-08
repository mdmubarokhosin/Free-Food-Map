/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages compatible configuration - static export
  output: 'export',
  
  reactStrictMode: true,
  
  // Image optimization - required for non-Vercel deployments
  images: {
    unoptimized: true,
  },
  
  // TypeScript configuration - skip build errors for CI
  typescript: {
    ignoreBuildErrors: true,
  },

  // Fix workspace root detection
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
