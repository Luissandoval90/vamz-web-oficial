import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  ...(process.env.VAMZ_STANDALONE === "1" ? { output: "standalone" as const, experimental: { cpus: 2 } } : {}),
  serverExternalPackages: ["bcrypt", "@libsql/client", "libsql"],
  turbopack: { root: process.cwd() },
};

export default nextConfig;
