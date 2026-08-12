import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Project path contains a space; pin turbopack root to the package root.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
