/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async rewrites() {
    return [
      // Serve favicon directly from public/ — prevents app router 500
      {
        source: '/favicon.ico',
        destination: '/icon-192.png',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Content-Type', value: 'image/png' },
          { key: 'Cache-Control', value: 'public, max-age=86400, immutable' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
