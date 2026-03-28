import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as bookingService from "../services/booking_service.js";
import { bookingQueue } from "../queues/booking_queue.js";
import { MAX_SEATS_PER_BOOKING } from "../utils/constants.js";
import logger from "../config/logger.js";
import { processRefund } from "../services/refund_service.js"; // add this import at top

// 🎟️ CREATE BOOKING
export const createBooking = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { showId, seatIds } = req.body;

  if (!showId || !seatIds || seatIds.length === 0) {
    const error = new Error("showId and seatIds are required");
    error.statusCode = 400;
    throw error;
  }

  if (seatIds.length > MAX_SEATS_PER_BOOKING) {
    const error = new Error(`Cannot book more than ${MAX_SEATS_PER_BOOKING} seats at once`);
    error.statusCode = 400;
    throw error;
  }

  // 🛡️ GUARD: Duplicate Block
  const existingActive = await prisma.booking.findFirst({
    where: {
      userId,
      showId,
      status: { in: ["PENDING", "PAID"] },
    },
  });

  if (existingActive) {
    const error = new Error("You already have an active booking for this show.");
    error.statusCode = 400;
    throw error;
  }

  const result = await bookingService.createBooking({
    userId,
    showId,
    seatIds,
  });

  res.status(202).json({
    success: true,
    message: "Booking request queued",
    jobId: result.jobId,
  });
});

// 📊 GET BOOKING STATUS (REST)
export const getBookingStatusRest = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const job = await bookingQueue.getJob(jobId);

  if (!job) return res.status(404).json({ status: "failed", reason: "Job not found" });

  const state = await job.getState();
  if (state === "completed") return res.json({ status: "success", booking: job.returnvalue });
  if (state === "failed") return res.json({ status: "failed", reason: job.failedReason });

  return res.json({ status: state });
});

// 📡 SSE BOOKING STATUS
export const getBookingStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!jobId) throw new Error("jobId is required");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const interval = setInterval(async () => {
    try {
      const job = await bookingQueue.getJob(jobId);
      if (!job) {
        res.write(`data: ${JSON.stringify({ status: "failed", reason: "Job not found" })}\n\n`);
        clearInterval(interval);
        return res.end();
      }

      const state = await job.getState();
      const data = { status: state };
      if (state === "completed") data.booking = job.returnvalue;
      if (state === "failed") data.reason = job.failedReason;

      res.write(`data: ${JSON.stringify(data)}\n\n`);

      if (state === "completed" || state === "failed") {
        clearInterval(interval);
        res.end();
      }
    } catch (err) {
      clearInterval(interval);
      res.end();
    }
  }, 2000);

  req.on("close", () => { clearInterval(interval); res.end(); });
});

// 📋 GET MY BOOKINGS
export const getMyBookings = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const bookings = await prisma.booking.findMany({
    where: { userId, status: { notIn: ["FAILED"] } },
    include: {
      show: { include: { movie: true, theatre: true } },
      seats: { include: { showSeat: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, bookings });
});

// ❌ CANCEL BOOKING
export const cancelBooking = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const bookingId = parseInt(id);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { show: true },
  });

  if (!booking || booking.userId !== userId) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  if (booking.status === "CANCELLED") {
    const error = new Error("Booking is already cancelled");
    error.statusCode = 400;
    throw error;
  }

  if (booking.status === "FAILED") {
    const error = new Error("Cannot cancel a failed booking");
    error.statusCode = 400;
    throw error;
  }

  // ── PENDING cancel — no refund needed ──────────────────────────────────────
  if (booking.status === "PENDING") {
    await prisma.$transaction([
      prisma.showSeat.updateMany({
        where: { pendingBookingId: bookingId },
        data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      }),
    ]);
    return res.json({ success: true, message: "Pending booking cancelled and seats released." });
  }

  // ── PAID cancel — time-based refund policy ─────────────────────────────────
  const now = new Date();
  const showTime = new Date(booking.show.startTime);
  const hoursRemaining = (showTime - now) / (1000 * 60 * 60);

  if (hoursRemaining < 0) {
    const error = new Error("Cannot cancel a show that has already started.");
    error.statusCode = 400;
    throw error;
  }

  let refundAmount;
  let message;

  if (hoursRemaining >= 24) {
    refundAmount = booking.totalAmount;
    message = "Booking cancelled. 100% refund initiated.";
  } else if (hoursRemaining >= 4) {
    refundAmount = Math.round((booking.totalAmount || 0) * 0.5 * 100) / 100;
    message = "Booking cancelled. 50% refund initiated.";
  } else {
    refundAmount = 0;
    message = "Booking cancelled. No refund (under 4 hours to show). Seats released.";
  }

  // ── Release seats + update booking in DB ───────────────────────────────────
  await prisma.$transaction([
    prisma.showSeat.updateMany({
      where: { pendingBookingId: bookingId },
      data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        refundAmount,
      },
    }),
  ]);

  // ── Stripe refund (CARD only, only if refundAmount > 0) ────────────────────
  if (booking.paymentType === "CARD" && booking.paymentId && refundAmount > 0) {
    try {
      await processRefund({
        bookingId,
        refundAmount,
        paymentId: booking.paymentId,
      });
    } catch (err) {
      // DB is already updated — log but don't fail the response
      logger.error(`Stripe refund failed for booking ${bookingId}: ${err.message}`);
      return res.json({
        success: true,
        message: `${message} (Note: Stripe refund failed — contact support)`,
        refundAmount,
      });
    }
  }

  return res.json({ success: true, message, refundAmount });
});