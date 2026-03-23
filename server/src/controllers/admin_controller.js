import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import { bookingQueue } from "../queues/booking_queue.js";
import { processRefund, processBulkRefunds } from "../services/refund_service.js";
import { PAYMENT_TYPE } from "../utils/constants.js";

import {
  sendShowCancelledEmail,
  sendBookingCancelledEmail,
} from "../services/email_service.js";
import logger from "../config/logger.js";

// 👥 GET ALL USERS (with pagination)
export const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count(),
  ]);

  res.json({
    success: true,
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// 🗑️ DELETE USER
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (user.role === "ADMIN") {
    const error = new Error("Cannot delete an admin user");
    error.statusCode = 400;
    throw error;
  }

  await prisma.user.delete({ where: { id: parseInt(id) } });
  logger.info(`User deleted: ${user.email}`);
  res.json({ message: "User deleted successfully" });
});

// 📋 GET ALL BOOKINGS (with pagination)
export const getAllBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, username: true } },
        show: { include: { movie: true, theatre: true } },
        seats: { include: { showSeat: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.booking.count(),
  ]);

  res.json({
    success: true,
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// 🎫 ADMIN WINDOW BOOKING
export const adminCreateBooking = asyncHandler(async (req, res) => {
  const adminId = req.user.userId;
  const { showId, seatIds, paymentType } = req.body;

  if (!showId || !seatIds || seatIds.length === 0 || !paymentType) {
    const error = new Error("showId, seatIds and paymentType are required");
    error.statusCode = 400;
    throw error;
  }

  if (!Object.values(PAYMENT_TYPE).includes(paymentType)) {
    const error = new Error("paymentType must be CASH or CARD");
    error.statusCode = 400;
    throw error;
  }

  const show = await prisma.show.findUnique({ where: { id: showId } });

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

  const job = await bookingQueue.add(
    "bookSeats",
    { userId: adminId, showId, seatIds, paymentType, isWindowBooking: true },
    { attempts: 3, backoff: { type: "exponential", delay: 2000 } }
  );

  logger.info(`Admin window booking queued: job ${job.id}`);

  return res.status(202).json({
    success: true,
    message: paymentType === "CASH"
      ? "Window booking created and marked as PAID"
      : "Window booking queued — proceed to payment",
    jobId: job.id,
  });
});

// ❌ ADMIN CANCEL SHOW + REFUND ALL
export const adminCancelShow = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const show = await prisma.show.findUnique({
    where: { id: parseInt(id) },
    include: {
      movie: true,
      theatre: true,
      bookings: {
        where: { status: "PAID" },
        include: { user: true, seats: true },
      },
    },
  });

  if (!show) {
    const error = new Error("Show not found");
    error.statusCode = 404;
    throw error;
  }

  if (!show.isActive) {
    const error = new Error("Show already cancelled");
    error.statusCode = 400;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.showSeat.updateMany({
      where: { showId: parseInt(id) },
      data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
    });

    await tx.booking.updateMany({
      where: { showId: parseInt(id), status: { in: ["PENDING", "PAID"] } },
      data: { status: "CANCELLED", cancelledAt: new Date(), refundAmount: { set: null } },
    });

    await tx.show.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });
  });

  await processBulkRefunds(parseInt(id));

  for (const booking of show.bookings) {
    sendShowCancelledEmail({
      user: booking.user,
      booking,
      show,
      refundAmount: booking.totalAmount,
    }).catch((err) => logger.error(`Show cancel email error: ${err.message}`));
  }

  logger.info(`Show ${id} cancelled by admin. Affected bookings: ${show.bookings.length}`);

  res.json({
    message: "Show cancelled successfully",
    affectedBookings: show.bookings.length,
  });
});

// ❌ ADMIN CANCEL SPECIFIC BOOKING
export const adminCancelBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  const { seatIds } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: {
      user: true,
      show: { include: { movie: true, theatre: true } },
      seats: { include: { showSeat: true } },
    },
  });

  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }

  if (booking.status === "CANCELLED") {
    const error = new Error("Booking already cancelled");
    error.statusCode = 400;
    throw error;
  }

  const seatsToCancel = seatIds
    ? booking.seats.filter((bs) => seatIds.includes(bs.showSeatId))
    : booking.seats;

  if (seatsToCancel.length === 0) {
    const error = new Error("No matching seats found");
    error.statusCode = 400;
    throw error;
  }

  const cancelledAmount = seatsToCancel.reduce((sum, bs) => sum + bs.seatPrice, 0);
  const refundAmount = cancelledAmount; // Admin always 100%

  if (booking.paymentType === "CARD" && booking.paymentId) {
    await processRefund({ bookingId: booking.id, refundAmount, paymentId: booking.paymentId });
  }

  await prisma.$transaction(async (tx) => {
    await tx.showSeat.updateMany({
      where: { id: { in: seatsToCancel.map((bs) => bs.showSeatId) } },
      data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
    });

    await tx.bookingSeat.deleteMany({
      where: {
        bookingId: booking.id,
        showSeatId: { in: seatsToCancel.map((bs) => bs.showSeatId) },
      },
    });

    const remainingSeats = booking.seats.length - seatsToCancel.length;

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        totalAmount: (booking.totalAmount || 0) - cancelledAmount,
        status: remainingSeats === 0 ? "CANCELLED" : "PAID",
        cancelledAt: remainingSeats === 0 ? new Date() : null,
        refundAmount,
      },
    });
  });

  sendBookingCancelledEmail({
    user: booking.user,
    booking,
    show: booking.show,
    refundAmount,
    cancelledSeats: seatsToCancel.length,
  }).catch((err) => logger.error(`Cancel email error: ${err.message}`));

  logger.info(`Admin cancelled booking ${bookingId}. Refund: ₹${refundAmount}`);

  return res.json({
    message: booking.paymentType === "CASH"
      ? `Booking cancelled. Customer collects ₹${refundAmount} cash refund.`
      : `Booking cancelled. ₹${refundAmount} refunded to customer.`,
    refundAmount,
    cancelledSeats: seatsToCancel.length,
  });
});

// ADMIN CANCEL MOVIE + ALL SHOWS + REFUNDS
export const adminCancelMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await prisma.movie.findUnique({
    where: { id: parseInt(id) },
    include: { shows: { where: { isActive: true } } },
  });

  if (!movie) {
    const error = new Error("Movie not found");
    error.statusCode = 404;
    throw error;
  }

  // Cancel all active shows first
  for (const show of movie.shows) {
    const bookings = await prisma.booking.findMany({
      where: { showId: show.id, status: "PAID" },
      include: { user: true, seats: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.showSeat.updateMany({
        where: { showId: show.id },
        data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
      });

      await tx.booking.updateMany({
        where: { showId: show.id, status: { in: ["PENDING", "PAID"] } },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });

      await tx.show.update({
        where: { id: show.id },
        data: { isActive: false },
      });
    });

    await processBulkRefunds(show.id);

    const fullShow = await prisma.show.findUnique({
      where: { id: show.id },
      include: { movie: true, theatre: true },
    });

    for (const booking of bookings) {
      sendShowCancelledEmail({
        user: booking.user,
        booking,
        show: fullShow,
        refundAmount: booking.totalAmount,
      }).catch((err) => logger.error(`Movie cancel email error: ${err.message}`));
    }
  }

  // ✅ Always delete the movie itself
  await prisma.movie.delete({
    where: { id: parseInt(id) },
  });

  logger.info(`Movie ${id} deleted. ${movie.shows.length} shows cancelled.`);

  res.json({
    message: `Movie deleted successfully. ${movie.shows.length} shows cancelled.`,
    cancelledShows: movie.shows.length,
  });
});