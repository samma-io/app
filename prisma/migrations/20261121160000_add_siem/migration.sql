-- CreateEnum
CREATE TYPE "SiemHosting" AS ENUM ('ANKRA_SAMMA', 'ANKRA_OWN', 'CONNECTED');

-- CreateTable
CREATE TABLE "SiemInstance" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hosting" "SiemHosting" NOT NULL,
    "provider" TEXT,
    "region" TEXT,
    "apiKeyHash" TEXT NOT NULL,
    "apiKeyLast4" TEXT NOT NULL,
    "rulesetVersion" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiemInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiemSubscription" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3),

    CONSTRAINT "SiemSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiemInstance_apiKeyHash_key" ON "SiemInstance"("apiKeyHash");

-- CreateIndex
CREATE INDEX "SiemInstance_organisationId_idx" ON "SiemInstance"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "SiemInstance_organisationId_name_key" ON "SiemInstance"("organisationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SiemSubscription_organisationId_key" ON "SiemSubscription"("organisationId");

-- AddForeignKey
ALTER TABLE "SiemInstance" ADD CONSTRAINT "SiemInstance_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiemSubscription" ADD CONSTRAINT "SiemSubscription_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
