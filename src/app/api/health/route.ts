import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** GET /api/health — liveness: the process answers. Touches no database. */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
