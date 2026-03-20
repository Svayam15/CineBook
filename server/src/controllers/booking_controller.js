import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as bookingService from "../services/booking_service.js";
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


// 📊 GET BOOKING STATUS
export const getBookingStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId) {
    const error = new Error("jobId is required");
    error.statusCode = 400;
    throw error;
  }

  const result = await bookingService.getBookingStatus(jobId);

  res.status(200).json({
    success: true,
    ...result,
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