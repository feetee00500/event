import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  experimental: {
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
