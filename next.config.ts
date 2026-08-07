import type { NextConfig } from 'next';

const internalApiUrl = new URL(
  process.env.INTERNAL_API_URL ?? 'http://127.0.0.1:8000/api/v1'
);
const backendBasePath = internalApiUrl.pathname.replace(/\/api\/v1\/?$/, '');
const backendBaseUrl = `${internalApiUrl.origin}${backendBasePath}`;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendBaseUrl}/api/:path*`,
      },
      {
        source: '/storage/:path*',
        destination: `${backendBaseUrl}/storage/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/dashboard/admin', destination: '/admin', permanent: false },
      {
        source: '/dashboard/admin/:path*',
        destination: '/admin/:path*',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
