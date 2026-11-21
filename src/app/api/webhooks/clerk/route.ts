import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import {
  lockOrg,
  removeMembership,
  upsertMembershipFromClerk,
  upsertOrgFromClerk,
} from "@/lib/clerk-sync";

// Clerk → Samma org sync (Svix-signed, secret CLERK_WEBHOOK_SIGNING_SECRET).
// Handlers are idempotent; a 5xx makes Clerk retry.
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (evt.type) {
      case "organization.created":
      case "organization.updated":
        await upsertOrgFromClerk(evt.data);
        break;
      case "organization.deleted":
        if (evt.data.id) await lockOrg(evt.data.id);
        break;
      case "organizationMembership.created":
      case "organizationMembership.updated":
        await upsertMembershipFromClerk(evt.data);
        break;
      case "organizationMembership.deleted":
        await removeMembership(evt.data.organization.id, evt.data.public_user_data.user_id);
        break;
      default:
        // Not subscribed / not needed.
        break;
    }
  } catch (err) {
    console.error(`[clerk-webhook] ${evt.type} failed:`, err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
