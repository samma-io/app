import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    // include the prisma query engine in standalone output
    "**": ["./node_modules/.prisma/client/**"],
  },
};

export default nextConfig;
