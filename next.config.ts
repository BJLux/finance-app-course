import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep better-sqlite3's native binding out of the bundle so it loads from
  // node_modules at runtime — required for the serverless build on Vercel.
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
