/*
  Warnings:

  - The values [CONFIRMED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `price` on the `Show` table. All the data in the column will be lost.
  - Added the required column `seatPrice` to the `BookingSeat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seatType` to the `BookingSeat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regularPrice` to the `Show` table without a default value. This is not possible if the table is not empty.
  - Added the required column `showType` to the `Show` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SeatType" AS ENUM ('REGULAR', 'GOLDEN');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CARD');

-- CreateEnum
CREATE TYPE "ShowType" AS ENUM ('TWO_D', 'THREE_D', 'FOUR_D');

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'FAILED');
ALTER TABLE "Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "BookingStatus_old";
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'CARD',
ADD COLUMN     "refundAmount" DOUBLE PRECISION,
ADD COLUMN     "refundId" TEXT;

-- AlterTable
ALTER TABLE "BookingSeat" ADD COLUMN     "seatPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "seatType" "SeatType" NOT NULL;

-- AlterTable
ALTER TABLE "Show" DROP COLUMN "price",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "goldenPrice" DOUBLE PRECISION,
ADD COLUMN     "goldenSeats" INTEGER,
ADD COLUMN     "hasGoldenSeats" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "regularPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "showType" "ShowType" NOT NULL;

-- AlterTable
ALTER TABLE "ShowSeat" ADD COLUMN     "type" "SeatType" NOT NULL DEFAULT 'REGULAR';
