import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  images: {
    minimumCacheTTL: 60,
    localPatterns: [
      { pathname: "/api/resources/**" },
      { pathname: "/**", search: "" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    ] }];
  },
  ...(process.env.VAMZ_STANDALONE === "1" ? { output: "standalone" as const, experimental: { cpus: 2 } } : {}),
  serverExternalPackages: ["bcrypt", "@libsql/client", "libsql"],
  turbopack: { root: process.cwd() },
};

export default nextConfig;
