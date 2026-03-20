import prisma from "../utils/prisma.js";
import { bookingQueue } from "../queues/booking_queue.js";
import {
  LOCK_EXPIRY_TIME,
  BOOKING_STATUS,
  CANCELLATION_HOURS_THRESHOLD,
  CANCELLATION_FEE_PERCENT,
} from "../utils/constants.js";

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

    console.log(`♻️ Released ${expiredSeats.length} expired locked seats`);
  } catch (err) {
    console.error("Failed to release expired locks:", err.message);
  }
};

// 🎟️ CREATE BOOKING
export const createBooking = async ({ userId, showId, seatIds, paymentType }) => {
  await releaseExpiredLocks();

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

  console.log(`📥 Booking job queued: ${job.id}`);

  return { jobId: job.id };
};

// 📊 GET BOOKING STATUS
export const getBookingStatus = async (jobId) => {
  const job = await bookingQueue.getJob(jobId);

  if (!job) {
    const error = new Error("Job not found");
    error.statusCode = 404;
    throw error;
  }

  const state = await job.getState();

  if (state === "completed") {
    return {
      status: "success",
      booking: job.returnvalue,
    };
  }

  if (state === "failed") {
    return {
      status: "failed",
      reason: job.failedReason,
    };
  }

  return { status: state };
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
    // More than 3 hours before show → full refund
    return totalAmount;
  } else {
    // Less than 3 hours → 10% fee deducted
    const cancellationFee = totalAmount * (CANCELLATION_FEE_PERCENT / 100);
    return totalAmount - cancellationFee;
  }
};

// ❌ CANCEL SPECIFIC SEATS IN A BOOKING
export const cancelSeats = async ({ bookingId, seatIds, cancelledByAdmin = false }) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      show: true,
      seats: {
        include: { showSeat: true },
      },
    },
  });

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  if (booking.status === BOOKING_STATUS.CANCELLED) {
    const error = new Error("Booking already cancelled");
    error.statusCode = 400;
    throw error;
  }

  // Find the booking seats to cancel
  const seatsToCancel = booking.seats.filter((bs) =>
    seatIds.includes(bs.showSeatId)
  );

  if (seatsToCancel.length === 0) {
    const error = new Error("No matching seats found in this booking");
    error.statusCode = 400;
    throw error;
  }

  // Calculate refund for cancelled seats
  const cancelledAmount = seatsToCancel.reduce((sum, bs) => sum + bs.seatPrice, 0);
  const refundAmount = calculateRefund(
    cancelledAmount,
    booking.show.startTime,
    cancelledByAdmin
  );

  await prisma.$transaction(async (tx) => {
    // Release seats back to AVAILABLE
    await tx.showSeat.updateMany({
      where: { id: { in: seatsToCancel.map((bs) => bs.showSeatId) } },
      data: {
        status: "AVAILABLE",
        lockedAt: null,
        pendingBookingId: null,
      },
    });

    // Delete BookingSeat records
    await tx.bookingSeat.deleteMany({
      where: {
        bookingId,
        showSeatId: { in: seatsToCancel.map((bs) => bs.showSeatId) },
      },
    });

    // Update booking totalAmount
    const newTotalAmount = (booking.totalAmount || 0) - cancelledAmount;

    // If all seats cancelled → mark booking as CANCELLED
    const remainingSeats = booking.seats.length - seatsToCancel.length;

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        totalAmount: newTotalAmount,
        status: remainingSeats === 0 ? BOOKING_STATUS.CANCELLED : booking.status,
        cancelledAt: remainingSeats === 0 ? new Date() : null,
      },
    });
  });

  return {
    refundAmount,
    cancelledSeats: seatsToCancel.length,
    paymentType: booking.paymentType,
    paymentId: booking.paymentId,
  };
};