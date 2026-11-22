import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // One prom-client instance for every server bundle (src/lib/metrics).
  serverExternalPackages: ["prom-client"],
  outputFileTracingIncludes: {
    // include the prisma query engine in standalone output
    "**": ["./node_modules/.prisma/client/**"],
  },
};

export default nextConfig;
