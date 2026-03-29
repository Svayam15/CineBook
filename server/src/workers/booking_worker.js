import { Worker } from "bullmq";
import connection from "../config/redis.js";
import prisma from "../utils/prisma.js";
import logger from "../config/logger.js";
import { SEAT_STATUS, BOOKING_STATUS } from "../utils/constants.js";

const worker = new Worker(
  "bookingQueue",
  async (job) => {
    const {
      userId,
      showId,
      seatIds,
      paymentType,
      isWindowBooking,
      totalAmount,      // ✅ pre-calculated in booking_service
      seats,            // ✅ pre-fetched in booking_service
      regularPrice,     // ✅ pre-fetched in booking_service
      goldenPrice,      // ✅ pre-fetched in booking_service
    } = job.data;

    return prisma.$transaction(async (tx) => {

      // ✅ REMOVED: show fetch — already validated in booking_service
      // ✅ REMOVED: seats fetch — already passed in job.data
      // ✅ REMOVED: totalAmount calculation — already done in booking_service
      // Worker now starts directly at the critical section

      // ✅ Step 1 — atomically lock all seats in ONE query
      // This is the core concurrency check
      const lockedSeats = await tx.showSeat.updateMany({
        where: {
          id: { in: seatIds },
          status: SEAT_STATUS.AVAILABLE, // ✅ only locks if still available
        },
        data: {
          status: SEAT_STATUS.LOCKED,
          lockedAt: new Date(),
        },
      });

      // ✅ Step 2 — if any seat was taken by someone else, abort immediately
      if (lockedSeats.count !== seatIds.length) {
        throw new Error("Seats just got booked by someone else");
      }

      // ✅ Step 3 — create booking record
      const booking = await tx.booking.create({
        data: {
          userId,
          showId,
          status: BOOKING_STATUS.PENDING,
          paymentType: paymentType || "CARD",
          totalAmount,
        },
      });

      // ✅ Step 4 — attach booking id to locked seats
      await tx.showSeat.updateMany({
        where: { id: { in: seatIds }, status: SEAT_STATUS.LOCKED },
        data: { pendingBookingId: booking.id },
      });

      // ✅ Step 5 — CASH or window booking: mark as PAID immediately, skip Stripe
      if (paymentType === "CASH" || isWindowBooking) {
        await tx.showSeat.updateMany({
          where: { pendingBookingId: booking.id },
          data: {
            status: SEAT_STATUS.BOOKED,
            lockedAt: null,
            pendingBookingId: null,
          },
        });

        // ✅ Use pre-fetched seats for bookingSeat creation — correct types + prices
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

        return { ...booking, status: "PAID", totalAmount };
      }

      // ✅ Step 5 (CARD) — return PENDING, frontend will handle Stripe
      return { ...booking, totalAmount };
    });
  },
  {
    connection,
    lockDuration: 30000,
    lockRenewTime: 15000,
    drainDelay: 300,
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