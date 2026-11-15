-- AlterTable
ALTER TABLE "Target" ADD COLUMN     "clusterId" TEXT;

-- CreateTable
CREATE TABLE "Cluster" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cluster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cluster_organisationId_name_key" ON "Cluster"("organisationId", "name");

-- CreateIndex
CREATE INDEX "Target_clusterId_idx" ON "Target"("clusterId");

-- AddForeignKey
ALTER TABLE "Target" ADD CONSTRAINT "Target_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "Cluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cluster" ADD CONSTRAINT "Cluster_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
