import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Transpile Dynamic Labs SDK packages for proper bundling
  transpilePackages: [
    "@dynamic-labs/sdk-react-core",
    "@dynamic-labs/cosmos",
  ],

  // Optimize imports for large packages (tree-shaking)
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@cosmjs/stargate",
      "@cosmjs/amino",
      "@cosmjs/proto-signing",
      "@cosmjs/encoding",
    ],
  },

  // Turbopack configuration (used with `next dev --turbopack`)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Webpack configuration (used with `next build` and `next dev:webpack`)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Node.js polyfill fallbacks for client-side builds
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default withSerwist(nextConfig);
