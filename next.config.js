/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // For GitHub Pages deployment
  output: 'export',
  // Update basePath if your repo name is not 'finance'
  // basePath: '/finance',
  images: {
    unoptimized: true,
  },
};
