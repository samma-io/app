import { CreateOrganization } from "@clerk/nextjs";
import { requireUser } from "@/lib/auth";

// The org is created in Clerk; the local org follows via the webhook, or
// lazily when it becomes the active org (src/lib/clerk-sync.ts).
export default async function NewOrgPage() {
  await requireUser();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <CreateOrganization routing="hash" afterCreateOrganizationUrl="/dashboard" skipInvitationScreen={false} />
    </div>
  );
}
