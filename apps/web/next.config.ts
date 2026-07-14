import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
/** Repo name on GitHub Pages: https://<user>.github.io/BOS/ */
const repoBase = "/BOS";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  transpilePackages: ["@ylika/shared"],
  ...(isGithubPages
    ? {
        basePath: repoBase,
        assetPrefix: repoBase,
      }
    : {}),
  turbopack: {
    root: "../..",
  },
};

export default nextConfig;
