import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateApiToken, parseLimit } from "@/lib/api-auth";
import { registerTargetWithOperator, removeTargetFromOperator } from "@/lib/operator";
import { isLocalTarget } from "@/lib/network";
import { targetSelect } from "@/lib/api-targets";

async function resolveProfile(orgId: string, profileId: unknown) {
  if (profileId && typeof profileId === "string") {
    return prisma.profile.findFirst({
      where: { id: profileId, organisationId: orgId },
    });
  }
  return prisma.profile.findFirst({
    where: { organisationId: orgId, isDefault: true },
  });
}

/**
 * GET /api/v1/targets?profileId=&q=&type=ip|dns&limit=&cursor=
 * Lists the organisation's targets, newest first. Cursor-paginated: pass the
 * returned nextCursor to get the next page.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateApiToken(req);
  if (!auth.ok) return auth.response;

  const sp = req.nextUrl.searchParams;
  const type = sp.get("type");
  if (type && type !== "ip" && type !== "dns") {
    return NextResponse.json({ error: "Field 'type' must be 'ip' or 'dns'" }, { status: 400 });
  }
  const profileId = sp.get("profileId") || undefined;
  const q = sp.get("q")?.trim() || undefined;
  const cursor = sp.get("cursor") || undefined;
  const limit = parseLimit(sp.get("limit"), 50, 100);

  if (profileId) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, organisationId: auth.organisationId },
      select: { id: true },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const where = {
    profile: { organisationId: auth.organisationId },
    ...(profileId ? { profileId } : {}),
    ...(type ? { type: type as "ip" | "dns" } : {}),
    ...(q
      ? {
          OR: [
            { value: { contains: q, mode: "insensitive" as const } },
            { label: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // A cursor from another org simply matches nothing in `where`.
  const cursorRow = cursor
    ? await prisma.target.findFirst({ where: { ...where, id: cursor }, select: { id: true } })
    : null;
  if (cursor && !cursorRow) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  const rows = await prisma.target.findMany({
    where,
    select: targetSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursorRow ? { cursor: { id: cursorRow.id }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const targets = hasMore ? rows.slice(0, limit) : rows;
  return NextResponse.json({
    targets,
    nextCursor: hasMore ? targets[targets.length - 1].id : undefined,
  });
}

export async function POST(req: NextRequest) {
  // 1. Authenticate (read-only tokens are rejected for writes)
  const auth = await authenticateApiToken(req, { write: true });
  if (!auth.ok) return auth.response;
  const apiToken = auth.token;

  // 4. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { value, type, label, profileId } = body as Record<string, unknown>;

  if (!value || typeof value !== "string") {
    return NextResponse.json(
      { error: "Missing required field: value" },
      { status: 400 }
    );
  }
  if (!type || (type !== "ip" && type !== "dns")) {
    return NextResponse.json(
      { error: "Field 'type' must be 'ip' or 'dns'" },
      { status: 400 }
    );
  }

  // 5. Resolve profile — explicit id or fall back to org default
  const profile = await resolveProfile(apiToken.organisationId, profileId);

  if (!profile) {
    return NextResponse.json(
      {
        error: profileId
          ? "Profile not found"
          : "No default profile found. Please provide a profileId.",
      },
      { status: profileId ? 404 : 400 }
    );
  }

  // 6. Create the target
  const local = await isLocalTarget(value, type as "ip" | "dns");

  const target = await prisma.target.create({
    data: {
      profileId: profile.id,
      value,
      type,
      label: label && typeof label === "string" ? label : null,
      scannerStatus: local ? "LOCAL" : "READY_TO_DEPLOY",
    },
  });

  if (local) {
    return NextResponse.json({ ...target, scannerStatus: "LOCAL" }, { status: 201 });
  }

  const deployed = await registerTargetWithOperator(target.value, target.id, profile.type, profile.id)
    .catch((err) => { console.error("[operator] registration failed:", err); return false; });

  if (deployed) {
    await prisma.target.update({ where: { id: target.id }, data: { scannerStatus: "DEPLOYED" } });
  }

  return NextResponse.json(
    { ...target, scannerStatus: deployed ? "DEPLOYED" : "READY_TO_DEPLOY" },
    { status: 201 }
  );
}

export async function PUT(req: NextRequest) {
  // 1. Authenticate (read-only tokens are rejected for writes)
  const auth = await authenticateApiToken(req, { write: true });
  if (!auth.ok) return auth.response;
  const apiToken = auth.token;

  // 4. Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { value, type, label, profileId } = body as Record<string, unknown>;

  if (!value || typeof value !== "string") {
    return NextResponse.json(
      { error: "Missing required field: value" },
      { status: 400 }
    );
  }
  if (!type || (type !== "ip" && type !== "dns")) {
    return NextResponse.json(
      { error: "Field 'type' must be 'ip' or 'dns'" },
      { status: 400 }
    );
  }

  // 5. Resolve profile — explicit id or fall back to org default
  const profile = await resolveProfile(apiToken.organisationId, profileId);

  if (!profile) {
    return NextResponse.json(
      {
        error: profileId
          ? "Profile not found"
          : "No default profile found. Please provide a profileId.",
      },
      { status: profileId ? 404 : 400 }
    );
  }

  // 6. Check for existing target (upsert logic)
  const existing = await prisma.target.findFirst({
    where: { profileId: profile.id, value },
  });

  if (existing) {
    return NextResponse.json(existing, { status: 202 });
  }

  // 7. Create new target
  const local = await isLocalTarget(value, type as "ip" | "dns");

  const target = await prisma.target.create({
    data: {
      profileId: profile.id,
      value,
      type,
      label: label && typeof label === "string" ? label : null,
      scannerStatus: local ? "LOCAL" : "READY_TO_DEPLOY",
    },
  });

  if (local) {
    return NextResponse.json({ ...target, scannerStatus: "LOCAL" }, { status: 200 });
  }

  const deployed = await registerTargetWithOperator(target.value, target.id, profile.type, profile.id)
    .catch((err) => { console.error("[operator] registration failed:", err); return false; });

  if (deployed) {
    await prisma.target.update({ where: { id: target.id }, data: { scannerStatus: "DEPLOYED" } });
  }

  return NextResponse.json(
    { ...target, scannerStatus: deployed ? "DEPLOYED" : "READY_TO_DEPLOY" },
    { status: 200 }
  );
}

export async function DELETE(req: NextRequest) {
  // 1. Authenticate (read-only tokens are rejected for writes)
  const auth = await authenticateApiToken(req, { write: true });
  if (!auth.ok) return auth.response;
  const apiToken = auth.token;

  // 4. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { value, id } = body as Record<string, unknown>;

  if (value !== undefined && value !== null && typeof value !== "string") {
    return NextResponse.json(
      { error: "Field 'value' must be a string" },
      { status: 400 }
    );
  }
  if (id !== undefined && id !== null && typeof id !== "string") {
    return NextResponse.json(
      { error: "Field 'id' must be a string" },
      { status: 400 }
    );
  }

  if (!value && !id) {
    return NextResponse.json(
      { error: "Provide 'value' (target string) or 'id' (target ID)" },
      { status: 400 }
    );
  }

  // 5. Find target scoped to this org
  const target = await prisma.target.findFirst({
    where: {
      profile: { organisationId: apiToken.organisationId },
      ...(id && typeof id === "string" ? { id } : {}),
      ...(value && typeof value === "string" ? { value } : {}),
    },
  });

  if (!target) {
    return NextResponse.json({ error: "Target not found" }, { status: 404 });
  }

  // 6. Remove from operator (fire-and-forget)
  removeTargetFromOperator(target.value).catch(
    (err) => console.error("[operator] remove on API delete failed:", err)
  );

  // 7. Delete from DB
  await prisma.target.delete({ where: { id: target.id } });

  return NextResponse.json({ deleted: target.id }, { status: 200 });
}
