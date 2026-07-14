import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ylika/shared"],
  turbopack: {
    root: "../..",
  },
};

export default nextConfig;
