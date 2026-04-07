-- CreateEnum
CREATE TYPE "ScannerStatus" AS ENUM ('READY_TO_DEPLOY', 'DEPLOYED');

-- CreateEnum
CREATE TYPE "ReachabilityStatus" AS ENUM ('UP', 'DOWN', 'UNKNOWN');

-- AlterTable
ALTER TABLE "Target" ADD COLUMN     "reachabilityStatus" "ReachabilityStatus" NOT NULL DEFAULT 'UP',
ADD COLUMN     "scannerStatus" "ScannerStatus" NOT NULL DEFAULT 'READY_TO_DEPLOY';
