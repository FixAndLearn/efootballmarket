/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 420, 640, 768, 1024, 1280],
    imageSizes: [64, 96, 160, 256, 384],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
        },
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin-allow-popups',
        },
      ],
    },
    {
      source: '/(admin|api|orders|pay|dashboard)/:path*',
      headers: [
        { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
      ],
    },
  ],
  redirects: async () => [
    {
      source: '/marketplace',
      destination: '/browse',
      permanent: true,
    },
    {
      source: '/seller/orders/:id',
      destination: '/orders/:id',
      permanent: true,
    },
    {
      source: '/seller/orders',
      destination: '/dashboard/seller',
      permanent: true,
    },
    {
      source: '/seller/dashboard',
      destination: '/dashboard/seller',
      permanent: true,
    },
    {
      source: '/seller',
      destination: '/dashboard/seller',
      permanent: true,
    },
  ],
};

export default nextConfig;
