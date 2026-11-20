-- CreateTable
CREATE TABLE "ExternalScannerConnection" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "scannerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT NOT NULL,
    "apiKeyLast4" TEXT NOT NULL,
    "pricePerScanCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalScannerConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileExternalScanner" (
    "profileId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "enabledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileExternalScanner_pkey" PRIMARY KEY ("profileId","connectionId")
);

-- CreateIndex
CREATE INDEX "ExternalScannerConnection_organisationId_idx" ON "ExternalScannerConnection"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalScannerConnection_organisationId_name_key" ON "ExternalScannerConnection"("organisationId", "name");

-- CreateIndex
CREATE INDEX "ProfileExternalScanner_connectionId_idx" ON "ProfileExternalScanner"("connectionId");

-- AddForeignKey
ALTER TABLE "ExternalScannerConnection" ADD CONSTRAINT "ExternalScannerConnection_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileExternalScanner" ADD CONSTRAINT "ProfileExternalScanner_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileExternalScanner" ADD CONSTRAINT "ProfileExternalScanner_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "ExternalScannerConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

