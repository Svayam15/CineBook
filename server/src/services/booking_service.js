import prisma from "../utils/prisma.js";
import { bookingQueue } from "../queues/booking_queue.js";
import {
  LOCK_EXPIRY_TIME,
  BOOKING_STATUS,
  CANCELLATION_HOURS_FULL_REFUND,
  CANCELLATION_HOURS_PARTIAL_REFUND,
} from "../utils/constants.js";
import logger from "../config/logger.js";
import { broadcastToShow } from "../utils/sseManager.js";

// ⏱️ RELEASE EXPIRED LOCKS — replace in booking_service.js
// This version uses a single transaction to avoid the findMany → updateMany gap

export const releaseExpiredLocks = async () => {
  try {
    const expiryThreshold = new Date(Date.now() - LOCK_EXPIRY_TIME);

    // ✅ FIX: single transaction — find expired booking IDs and release atomically
    await prisma.$transaction(async (tx) => {
      // Step 1: get expired bookingIds before releasing (needed to mark bookings FAILED)
      const expiredSeats = await tx.showSeat.findMany({
        where: {
          status: "LOCKED",
          lockedAt: { lt: expiryThreshold },
        },
        select: { id:true, showId: true,  pendingBookingId: true },
      });

      if (expiredSeats.length === 0) return;

      const expiredBookingIds = [
        ...new Set(
          expiredSeats.map((s) => s.pendingBookingId).filter(Boolean)
        ),
      ];

      // Step 2: release seats (same condition — atomic within transaction)
      await tx.showSeat.updateMany({
        where: {
          status: "LOCKED",
          lockedAt: { lt: expiryThreshold },
        },
        data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
      });

      // Step 3: mark expired bookings as FAILED
      if (expiredBookingIds.length > 0) {
        await tx.booking.updateMany({
          where: {
            id: { in: expiredBookingIds },
            status: BOOKING_STATUS.PENDING,
          },
          data: { status: BOOKING_STATUS.FAILED },
        });
      }

      // ✅ Broadcast AVAILABLE to all clients for affected shows
  expiredSeats.forEach((seat) => {
    broadcastToShow(seat.showId, { seatId: seat.id, status: "AVAILABLE" });
  });

      logger.info(`♻️ Released ${expiredSeats.length} expired locked seats, ${expiredBookingIds.length} bookings marked FAILED`);
    });
  } catch (err) {
    logger.error(`Failed to release expired locks: ${err.message}`);
  }
};

// 🎟️ CREATE BOOKING
export const createBooking = async ({ userId, showId, seatIds, paymentType }) => {

  // ✅ Fetch show + seats together in parallel before queuing
  const [show, seats] = await Promise.all([
    prisma.show.findUnique({
      where: { id: showId },
      select: {
        startTime: true,
        isActive: true,
        regularPrice: true,
        goldenPrice: true,
      },
    }),
    prisma.showSeat.findMany({
      where: { id: { in: seatIds }, showId },
      select: { id: true, type: true, status: true },
    }),
  ]);

  if (!show) {
    const error = new Error("Show not found");
    error.statusCode = 404;
    throw error;
  }

  if (!show.isActive) {
    const error = new Error("This show has been cancelled");
    error.statusCode = 400;
    throw error;
  }

  if (new Date(show.startTime) <= new Date()) {
    const error = new Error("Show has already started. Booking is not allowed.");
    error.statusCode = 400;
    throw error;
  }

  if (seats.length !== seatIds.length) {
    const error = new Error("Some seats not found");
    error.statusCode = 400;
    throw error;
  }

  // ✅ Early availability check — fail fast before queuing
  const unavailableSeats = seats.filter((s) => s.status !== "AVAILABLE");
  if (unavailableSeats.length > 0) {
    const error = new Error("Some seats are no longer available");
    error.statusCode = 400;
    throw error;
  }

  // ✅ Pre-calculate totalAmount
  const totalAmount = seats.reduce((sum, seat) => {
    if (seat.type === "GOLDEN") return sum + (show.goldenPrice || 0);
    return sum + show.regularPrice;
  }, 0);

  const jobId = `booking-${userId}-${showId}-${Date.now()}`;

  const job = await bookingQueue.add(
    "bookSeats",
    {
      userId,
      showId,
      seatIds,
      paymentType,
      totalAmount,
      seats,
      regularPrice: show.regularPrice,
      goldenPrice: show.goldenPrice,
    },
    {
      jobId,
      attempts: 1,
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 3600 },
    }
  );

  logger.info(`📥 Booking job queued: ${job.id}`);
  return { jobId: job.id };
};

// 💰 CALCULATE REFUND
export const calculateRefund = (totalAmount, showStartTime, cancelledByAdmin = false) => {
  // ✅ Admin always gets 100% refund — no policy applied
  if (cancelledByAdmin) return totalAmount;

  const now = new Date();
  const showTime = new Date(showStartTime);
  const hoursRemaining = (showTime - now) / (1000 * 60 * 60);

  // ✅ Uses constants — change policy in one place
  if (hoursRemaining >= CANCELLATION_HOURS_FULL_REFUND) {
    return totalAmount; // 100%
  } else if (hoursRemaining >= CANCELLATION_HOURS_PARTIAL_REFUND) {
    return Math.round(totalAmount * 0.5 * 100) / 100; // 50%
  } else {
    return 0; // 0%
  }
};