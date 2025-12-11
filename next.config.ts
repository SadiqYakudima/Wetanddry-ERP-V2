import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Exclude problematic packages from server bundling
  serverExternalPackages: ['@libsql/client', '@prisma/adapter-libsql'],

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
