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
        lockedAt: {
          lt: new Date(Date.now() - LOCK_EXPIRY_TIME),
        },
      },
    });

    if (expiredSeats.length === 0) return;

    const expiredBookingIds = [
      ...new Set(expiredSeats.map((s) => s.pendingBookingId).filter(Boolean)),
    ];

    await prisma.showSeat.updateMany({
      where: {
        status: "LOCKED",
        lockedAt: {
          lt: new Date(Date.now() - LOCK_EXPIRY_TIME),
        },
      },
      data: {
        status: "AVAILABLE",
        lockedAt: null,
        pendingBookingId: null,
      },
    });

    if (expiredBookingIds.length > 0) {
      await prisma.booking.updateMany({
        where: {
          id: { in: expiredBookingIds },
          status: BOOKING_STATUS.PENDING,
        },
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
  await releaseExpiredLocks();

  // 🚫 Check if show exists and has already started
  const show = await prisma.show.findUnique({
    where: { id: showId },
    select: { startTime: true },
  });

  if (!show) {
    const error = new Error("Show not found");
    error.statusCode = 404;
    throw error;
  }

  if (new Date(show.startTime) <= new Date()) {
    const error = new Error("Show has already started. Booking is not allowed.");
    error.statusCode = 400;
    throw error;
  }

  const job = await bookingQueue.add(
    "bookSeats",
    { userId, showId, seatIds, paymentType },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    }
  );

  logger.info(`📥 Booking job queued: ${job.id}`);

  return { jobId: job.id };
};

// 💰 CALCULATE REFUND AMOUNT
export const calculateRefund = (totalAmount, showStartTime, cancelledByAdmin = false) => {
  // Admin cancellation → always 100% refund
  if (cancelledByAdmin) {
    return totalAmount;
  }

  const now = new Date();
  const showTime = new Date(showStartTime);
  const hoursBeforeShow = (showTime - now) / (1000 * 60 * 60);

  if (hoursBeforeShow > CANCELLATION_HOURS_THRESHOLD) {
    // More than threshold hours before show → full refund
    return totalAmount;
  } else {
    // Less than threshold hours → cancellation fee deducted
    const cancellationFee = totalAmount * (CANCELLATION_FEE_PERCENT / 100);
    return totalAmount - cancellationFee;
  }
};