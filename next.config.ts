import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Supabase Storage va boshqa rasm manbalaridan rasmlarni yuklash uchun
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 't.me',
      },
      {
        protocol: 'https',
        hostname: '*.telegram.org',
      },
    ],
  },

  turbopack: {},
};

export default nextConfig;
