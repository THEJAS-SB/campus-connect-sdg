import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler removed - requires babel-plugin-react-compiler
  // Install with: npm install babel-plugin-react-compiler

  // Allow larger server action payloads for base64-encoded avatar images
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
