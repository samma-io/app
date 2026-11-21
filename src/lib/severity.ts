// Severity levels, most severe first. Kept free of server-only imports (Prisma)
// so client components can use it.
export const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as const;
export type Severity = (typeof SEVERITIES)[number];
