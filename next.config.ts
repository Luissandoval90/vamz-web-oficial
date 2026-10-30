import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  serverExternalPackages: ["bcrypt"],
  turbopack: { root: process.cwd() },
};

export default nextConfig;
