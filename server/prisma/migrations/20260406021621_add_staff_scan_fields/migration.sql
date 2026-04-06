-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'STAFF';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "isUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "usedAt" TIMESTAMP(3);
