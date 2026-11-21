-- Link organisations to Clerk Organizations; soft-delete and plan fields.
ALTER TABLE "Organisation" ADD COLUMN "clerkOrgId" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Organisation" ADD COLUMN "planSlug" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "planPeriodStart" TIMESTAMP(3);
CREATE UNIQUE INDEX "Organisation_clerkOrgId_key" ON "Organisation"("clerkOrgId");
