import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/token";
import { registerTargetWithOperator } from "@/lib/operator";

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

export async function POST(req: NextRequest) {
  // 1. Extract bearer token
  const authHeader = req.headers.get("authorization") ?? "";
  const raw = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!raw) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Hash and look up in DB — indexed lookup
  const tokenHash = hashToken(raw);
  const apiToken = await prisma.apiToken.findUnique({ where: { tokenHash } });

  if (!apiToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Update lastUsedAt (fire-and-forget to keep latency low)
  prisma.apiToken
    .update({ where: { id: apiToken.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

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
  const target = await prisma.target.create({
    data: {
      profileId: profile.id,
      value,
      type,
      label: label && typeof label === "string" ? label : null,
    },
  });

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
  // 1. Extract bearer token
  const authHeader = req.headers.get("authorization") ?? "";
  const raw = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!raw) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Hash and look up in DB
  const tokenHash = hashToken(raw);
  const apiToken = await prisma.apiToken.findUnique({ where: { tokenHash } });

  if (!apiToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Update lastUsedAt (fire-and-forget)
  prisma.apiToken
    .update({ where: { id: apiToken.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

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
  const target = await prisma.target.create({
    data: {
      profileId: profile.id,
      value,
      type,
      label: label && typeof label === "string" ? label : null,
    },
  });

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
