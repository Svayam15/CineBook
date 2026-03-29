import prisma from "../utils/prisma.js";
import { bookingQueue } from "../queues/booking_queue.js";
import {
  LOCK_EXPIRY_TIME,
  BOOKING_STATUS,
  CANCELLATION_HOURS_THRESHOLD,
  CANCELLATION_FEE_PERCENT,
} from "../utils/constants.js";
import logger from "../config/logger.js";

// ⏱️ RELEASE EXPIRED LOCKS
export const releaseExpiredLocks = async () => {
  try {
    const expiredSeats = await prisma.showSeat.findMany({
      where: {
        status: "LOCKED",
        lockedAt: { lt: new Date(Date.now() - LOCK_EXPIRY_TIME) },
      },
    });

    if (expiredSeats.length === 0) return;

    const expiredBookingIds = [
      ...new Set(expiredSeats.map((s) => s.pendingBookingId).filter(Boolean)),
    ];

    await prisma.showSeat.updateMany({
      where: {
        status: "LOCKED",
        lockedAt: { lt: new Date(Date.now() - LOCK_EXPIRY_TIME) },
      },
      data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
    });

    if (expiredBookingIds.length > 0) {
      await prisma.booking.updateMany({
        where: { id: { in: expiredBookingIds }, status: BOOKING_STATUS.PENDING },
        data: { status: BOOKING_STATUS.FAILED },
      });
    }

    logger.info(`♻️ Released ${expiredSeats.length} expired locked seats`);
  } catch (err) {
    logger.error(`Failed to release expired locks: ${err.message}`);
  }
};

// 🎟️ CREATE BOOKING
export const createBooking = async ({ userId, showId, seatIds, paymentType }) => {

  // ✅ Fetch show + seats + validate everything BEFORE queuing
  // This saves 2 DB queries inside the worker transaction
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

  // ✅ All validations done here — worker doesn't need to repeat them
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

  // ✅ Early availability check — fail fast before even queuing
  const unavailableSeats = seats.filter((s) => s.status !== "AVAILABLE");
  if (unavailableSeats.length > 0) {
    const error = new Error("Some seats are no longer available");
    error.statusCode = 400;
    throw error;
  }

  // ✅ Pre-calculate totalAmount — worker doesn't need to do this
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
      totalAmount,          // ✅ pre-calculated
      seats,                // ✅ pre-fetched — includes type for bookingSeat
      regularPrice: show.regularPrice,  // ✅ pre-fetched
      goldenPrice: show.goldenPrice,    // ✅ pre-fetched
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
  if (cancelledByAdmin) return totalAmount;

  const now = new Date();
  const showTime = new Date(showStartTime);
  const hoursBeforeShow = (showTime - now) / (1000 * 60 * 60);

  if (hoursBeforeShow > CANCELLATION_HOURS_THRESHOLD) {
    return totalAmount;
  } else {
    const cancellationFee = totalAmount * (CANCELLATION_FEE_PERCENT / 100);
    return totalAmount - cancellationFee;
  }
};