import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: this repo's parent directory also contains a
  // package-lock.json (an unrelated sibling monorepo), which otherwise
  // makes Turbopack guess the wrong root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
