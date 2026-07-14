import type { NextConfig } from "next";
import path from "path";

const isGithubPages = process.env.GITHUB_PAGES === "true";
/** Static export only for Pages / explicit export builds — not during `next dev`. */
const isStaticExport =
  isGithubPages || process.env.NEXT_OUTPUT === "export";
/** Repo name on GitHub Pages: https://<user>.github.io/BOS/ */
const repoBase = "/BOS";

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" as const } : {}),
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
    root: path.resolve(__dirname, "../.."),
  },
};

export default nextConfig;
