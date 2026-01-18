import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Explicitly set root to avoid workspace inference issues
    root: process.cwd(),
  },
};

export default nextConfig;
