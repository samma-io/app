-- AlterTable
ALTER TABLE "SiemInstance" ADD COLUMN     "shareIndicators" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastIndicatorsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SiemRuleRelease" (
    "id" TEXT NOT NULL,
    "lane" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "ruleCount" INTEGER NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "bundle" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiemRuleRelease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiemIndicator" (
    "id" TEXT NOT NULL,
    "siemInstanceId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiemIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiemCommunityAllow" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiemCommunityAllow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiemBlocklistSnapshot" (
    "version" SERIAL NOT NULL,
    "body" TEXT NOT NULL,
    "digest" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiemBlocklistSnapshot_pkey" PRIMARY KEY ("version")
);

-- CreateIndex
CREATE INDEX "SiemRuleRelease_lane_createdAt_idx" ON "SiemRuleRelease"("lane", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiemRuleRelease_lane_version_key" ON "SiemRuleRelease"("lane", "version");

-- CreateIndex
CREATE INDEX "SiemIndicator_lastSeen_idx" ON "SiemIndicator"("lastSeen");

-- CreateIndex
CREATE INDEX "SiemIndicator_ip_idx" ON "SiemIndicator"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "SiemIndicator_siemInstanceId_ip_ruleId_key" ON "SiemIndicator"("siemInstanceId", "ip", "ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "SiemCommunityAllow_ip_key" ON "SiemCommunityAllow"("ip");

-- AddForeignKey
ALTER TABLE "SiemIndicator" ADD CONSTRAINT "SiemIndicator_siemInstanceId_fkey" FOREIGN KEY ("siemInstanceId") REFERENCES "SiemInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
