// next.config.js
// Configuration for Next.js application

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Enable React strict mode for highlighting potential problems
  swcMinify: true, // Enable SWC minifier for faster builds (default in newer Next.js)

  // Enable standalone output mode for optimized Docker deployment
  // This bundles only necessary files for production
  output: 'standalone',

  // Configure image optimization (if using Next/Image)
  images: {
    // Define allowed remote domains for images
    remotePatterns: [
      // Example: Allow images from Unsplash
      // {
      //   protocol: 'https',
      //   hostname: 'images.unsplash.com',
      //   port: '',
      //   pathname: '/**',
      // },
      // Example: Allow images from placehold.co (if used for placeholders)
      // {
      //   protocol: 'https',
      //   hostname: 'placehold.co',
      //   port: '',
      //   pathname: '/**',
      // },
    ],
    // Optional: Allow SVG loading from remote sources (use with caution)
    // dangerouslyAllowSVG: true,
    // Recommended Content Security Policy when allowing external SVGs
    // contentSecurityPolicy: "default-src 'self'; img-src 'self' <allowed-domains>; script-src 'none'; sandbox;",
  },

  // Optional: Add other Next.js configurations here
  // experimental: {
  //   appDir: true, // Enable if using the App Router (default in newer Next.js)
  // },
};

module.exports = nextConfig;

