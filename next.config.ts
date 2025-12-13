import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Exclude problematic packages from server bundling
  serverExternalPackages: ['@libsql/client', '@prisma/adapter-libsql'],

  // Prevent chunk loading failures after redeployments
  async headers() {
    return [
      {
        // Apply to all pages
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        // Don't cache HTML pages - always revalidate
        source: '/:path((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // Turbopack configuration (Next.js 16+)
  turbopack: {
    // Empty config to acknowledge we're using Turbopack
  },

  // Webpack fallback configuration for native modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@libsql/client': 'commonjs @libsql/client',
        '@libsql/isomorphic-ws': 'commonjs @libsql/isomorphic-ws',
      });
    }
    return config;
  },
};

export default nextConfig;
