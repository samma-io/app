import { Prisma } from "@prisma/client";

/** Fields of a Target exposed by the read API. */
export const targetSelect = {
  id: true,
  value: true,
  type: true,
  label: true,
  port: true,
  scannerStatus: true,
  reachabilityStatus: true,
  createdAt: true,
  profile: { select: { id: true, name: true, type: true } },
} satisfies Prisma.TargetSelect;

export type ApiTarget = Prisma.TargetGetPayload<{ select: typeof targetSelect }>;
