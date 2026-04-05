import { Worker } from "bullmq";
import { createRedisConnection } from "../config/redis.js";
import prisma from "../utils/prisma.js";
import logger from "../config/logger.js";
import { SEAT_STATUS, BOOKING_STATUS } from "../utils/constants.js";
import { broadcastToShow } from "../utils/sseManager.js";

const worker = new Worker(
  "bookingQueue",
  async (job) => {
    const {
      userId,
      showId,
      seatIds,
      paymentType,
      isWindowBooking,
      totalAmount,
      seats,
      regularPrice,
      goldenPrice,
    } = job.data;

    const result = await prisma.$transaction(async (tx) => {
      const lockedSeats = await tx.showSeat.updateMany({
        where: {
          id: { in: seatIds },
          status: SEAT_STATUS.AVAILABLE,
        },
        data: {
          status: SEAT_STATUS.LOCKED,
          lockedAt: new Date(),
        },
      });

      if (lockedSeats.count !== seatIds.length) {
        throw new Error("Seats just got booked by someone else");
      }

      const booking = await tx.booking.create({
        data: {
          userId,
          showId,
          status: BOOKING_STATUS.PENDING,
          paymentType: paymentType || "CARD",
          totalAmount,
        },
      });

      await tx.showSeat.updateMany({
        where: { id: { in: seatIds }, status: SEAT_STATUS.LOCKED },
        data: { pendingBookingId: booking.id },
      });

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
            seatPrice: seat.type === "GOLDEN" ? (goldenPrice || 0) : regularPrice,
          })),
        });

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BOOKING_STATUS.PAID },
        });

        return { ...booking, status: "PAID", totalAmount, _type: "CASH" };
      }

      return { ...booking, totalAmount, _type: "CARD" };
    });

    // ✅ Broadcast AFTER transaction commits
    if (result._type === "CASH") {
      seatIds.forEach((seatId) => broadcastToShow(showId, { seatId, status: "BOOKED" }));
    } else {
      // ✅ CARD — broadcast LOCKED so admin sees seats turn red immediately
      seatIds.forEach((seatId) => broadcastToShow(showId, { seatId, status: "LOCKED" }));
    }

    return result;
  },
  {
  connection: createRedisConnection(true), // ✅ isWorker = true, no commandTimeout
  concurrency: 1,
  lockDuration: 30000,
  lockRenewTime: 15000,
  drainDelay: 300,
}
);

worker.on("error", (err) => {
  logger.error(`Worker error: ${err.message}`);
});

worker.on("stalled", (jobId) => {
  logger.warn(`⚠️ Job stalled: ${jobId}`);
});

worker.on("active", (job) => {
  logger.info(`🔄 Job active: ${job.id}`);
});


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