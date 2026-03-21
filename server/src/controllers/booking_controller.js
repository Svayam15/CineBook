import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as bookingService from "../services/booking_service.js";
import { bookingQueue } from "../queues/booking_queue.js";
import { MAX_SEATS_PER_BOOKING } from "../utils/constants.js";

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

  const result = await bookingService.createBooking({
    userId,
    showId,
    seatIds,
  });

  res.status(202).json({
    success: true,
    message: "Booking request queued",
    ...result,
  });
});


// 📊 GET BOOKING STATUS VIA SSE
export const getBookingStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    const error = new Error("jobId is required");
    error.statusCode = 400;
    throw error;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Check job status every 1 second
  const interval = setInterval(async () => {
    try {
      const job = await bookingQueue.getJob(jobId);

      if (!job) {
        sendEvent({ status: "failed", reason: "Job not found" });
        clearInterval(interval);
        res.end();
        return;
      }

      const state = await job.getState();

      if (state === "completed") {
        sendEvent({ status: "success", booking: job.returnvalue });
        clearInterval(interval);
        res.end();
        return;
      }

      if (state === "failed") {
        sendEvent({ status: "failed", reason: job.failedReason });
        clearInterval(interval);
        res.end();
        return;
      }

      // Still processing
      sendEvent({ status: state });

    } catch (err) {
      sendEvent({ status: "failed", reason: err.message });
      clearInterval(interval);
      res.end();
    }
  }, 1000);

  // Cleanup if client disconnects
  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
});

// 📋 GET MY BOOKINGS
export const getMyBookings = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const bookings = await prisma.booking.findMany({
    where: { userId , status: { notIn: ["CANCELLED", "FAILED"] },},
    include: {
      show: {
        include: {
          movie: true,
          theatre: true,
        },
      },
      seats: {
        include: {
          showSeat: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({ success: true, bookings });
});

// ❌ CANCEL BOOKING
export const cancelBooking = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(id) },
    include: { seats: true },
  });

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  if (booking.userId !== userId) {
    const error = new Error("Unauthorized");
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === "PAID") {
    const error = new Error("Cannot cancel a paid booking");
    error.statusCode = 400;
    throw error;
  }

  // Release seats back to AVAILABLE
  await prisma.showSeat.updateMany({
    where: {
      pendingBookingId: parseInt(id),
    },
    data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
  });

  // Update booking status
  await prisma.booking.update({
    where: { id: parseInt(id) },
    data: { status: "FAILED" },
  });

  res.json({ success: true, message: "Booking cancelled" });
});