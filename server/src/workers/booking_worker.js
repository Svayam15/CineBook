import { Worker } from "bullmq";
import connection from "../config/redis.js";
import prisma from "../utils/prisma.js";
import logger from "../config/logger.js";
import { SEAT_STATUS, BOOKING_STATUS } from "../utils/constants.js";

const worker = new Worker(
  "bookingQueue",
  async (job) => {
    const { userId, showId, seatIds, paymentType, isWindowBooking } = job.data;

    return prisma.$transaction(async (tx) => {
      const show = await tx.show.findUnique({ where: { id: showId } });
      if (!show) throw new Error("Show not found");
      if (!show.isActive) throw new Error("This show has been cancelled");

      const seats = await tx.showSeat.findMany({
        where: { id: { in: seatIds }, showId },
      });

      if (seats.length !== seatIds.length) throw new Error("Some seats not found");

      const totalAmount = seats.reduce((sum, seat) => {
        if (seat.type === "GOLDEN") return sum + (show.goldenPrice || 0);
        return sum + show.regularPrice;
      }, 0);

      const booking = await tx.booking.create({
        data: {
          userId,
          showId,
          status: BOOKING_STATUS.PENDING,
          paymentType: paymentType || "CARD",
          totalAmount,
        },
      });

      const lockedSeats = await tx.showSeat.updateMany({
        where: { id: { in: seatIds }, status: SEAT_STATUS.AVAILABLE },
        data: {
          status: SEAT_STATUS.LOCKED,
          lockedAt: new Date(),
          pendingBookingId: booking.id,
        },
      });

      if (lockedSeats.count !== seatIds.length) {
        await tx.booking.delete({ where: { id: booking.id } });
        throw new Error("Seats just got booked by someone else");
      }

      if (paymentType === "CASH" || isWindowBooking) {
        await tx.showSeat.updateMany({
          where: { pendingBookingId: booking.id },
          data: { status: SEAT_STATUS.BOOKED, lockedAt: null, pendingBookingId: null },
        });

        await tx.bookingSeat.createMany({
          data: seats.map((seat) => ({
            bookingId: booking.id,
            showSeatId: seat.id,
            seatType: seat.type,
            seatPrice: seat.type === "GOLDEN" ? (show.goldenPrice || 0) : show.regularPrice,
          })),
        });

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BOOKING_STATUS.PAID },
        });

        return { ...booking, status: "PAID", totalAmount };
      }

      return { ...booking, totalAmount };
    });
  },
  {
    connection,
    stalledInterval: 60000,
    lockDuration: 60000,
    lockRenewTime: 30000,
    drainDelay: 30,
  }
);

worker.on("completed", (job) => {
  logger.info(`✅ Seats reserved for job ${job.id}`);
});

worker.on("failed", (job, err) => {
  logger.error(`❌ Booking failed for job ${job.id}: ${err.message}`);
});

logger.info("🚀 Worker started...");

process.on("SIGTERM", async () => {
  await worker.close();
  await prisma.$disconnect();
  logger.info("👋 Worker shut down");
});