-- CreateEnum
CREATE TYPE "ExternalScanStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ExternalScanRun" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "externalId" TEXT,
    "status" "ExternalScanStatus" NOT NULL DEFAULT 'RUNNING',
    "trigger" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "lastPolledAt" TIMESTAMP(3),
    "contentType" TEXT,
    "result" JSONB,
    "findingCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "ExternalScanRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalScanRun_organisationId_status_idx" ON "ExternalScanRun"("organisationId", "status");

-- CreateIndex
CREATE INDEX "ExternalScanRun_targetId_idx" ON "ExternalScanRun"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalScanRun_connectionId_externalId_key" ON "ExternalScanRun"("connectionId", "externalId");

-- AddForeignKey
ALTER TABLE "ExternalScanRun" ADD CONSTRAINT "ExternalScanRun_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalScanRun" ADD CONSTRAINT "ExternalScanRun_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ExternalScannerConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalScanRun" ADD CONSTRAINT "ExternalScanRun_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "Target"("id") ON DELETE CASCADE ON UPDATE CASCADE;
