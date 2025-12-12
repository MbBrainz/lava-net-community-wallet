import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,

  allowedDevOrigins: [
    `http://localhost:${process.env.PORT}`,
    `192.168.130.159`,
    `https://192.168.130.159:3001`,
  ],
  // Transpile Dynamic Labs SDK packages for proper bundling
  transpilePackages: [
    "@dynamic-labs/sdk-react-core",
  ],

  // Security headers for all routes
  headers: async () => [
    {
      // Apply to all API routes
      source: "/api/:path*",
      headers: [
        // Prevent embedding in iframes
        { key: "X-Frame-Options", value: "DENY" },
        // Prevent MIME sniffing
        { key: "X-Content-Type-Options", value: "nosniff" },
        // Restrict to same-origin requests only (no CORS for external domains)
        { key: "Access-Control-Allow-Origin", value: "" },
        // Disable credentials for cross-origin requests
        { key: "Access-Control-Allow-Credentials", value: "false" },
      ],
    },
  ],

  // Optimize imports for large packages (tree-shaking)
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
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

export default withBundleAnalyzer(withSerwist(nextConfig));
