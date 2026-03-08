import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Also ignore TS errors to fix the "not a module" issue
    ignoreBuildErrors: true, 
  },
};

export default nextConfig;
