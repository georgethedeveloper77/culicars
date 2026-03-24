// apps/web/next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'jiji.co.ke' },
      { protocol: 'https', hostname: '**.jiji.co.ke' },
      { protocol: 'https', hostname: 'beforward.jp' },
      { protocol: 'https', hostname: '**.beforward.jp' },
      { protocol: 'https', hostname: 'culicars.com' },
      { protocol: 'https', hostname: '**.culicars.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '**.wikimedia.org' },
      { protocol: 'https', hostname: 'images.pigiame.co.ke' },
      { protocol: 'https', hostname: '**.pigiame.co.ke' },
      { protocol: 'https', hostname: 'ke.jumia.is' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api.culicars.com'}/health`,
      },
    ];
  },
};

export default nextConfig;
