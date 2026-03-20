-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "totalAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Show" ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 500;
