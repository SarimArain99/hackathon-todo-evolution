import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker containerization (Phase IV)
  // This creates a minimal .next/standalone directory optimized for containerized deployment
  output: "standalone",

  turbopack: {
    // Explicitly set root to avoid workspace inference issues
    root: process.cwd(),
  },
};

export default nextConfig;
