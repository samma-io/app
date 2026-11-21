-- Billing details for an organisation (settings page).
ALTER TABLE "Organisation" ADD COLUMN "billingName" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "billingEmail" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "billingAddress1" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "billingAddress2" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "billingPostalCode" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "billingCity" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "billingCountry" TEXT;
ALTER TABLE "Organisation" ADD COLUMN "billingVatId" TEXT;
