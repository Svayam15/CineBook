import prisma from "../utils/prisma.js";
import { bookingQueue } from "../queues/booking_queue.js";
import { processRefund, processBulkRefunds } from "../services/refund_service.js";
import { calculateRefund } from "../services/booking_service.js";
import {
  sendShowCancelledEmail,
  sendBookingCancelledEmail,
} from "../services/email_service.js";

// 👥 GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
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
    });

    res.json({ success: true, users });
  } catch (err) {
    console.error("Get users error:", err.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// 🗑️ DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "ADMIN") {
      return res.status(400).json({ message: "Cannot delete an admin user" });
    }

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err.message);
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// 📋 GET ALL BOOKINGS
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, username: true },
        },
        show: {
          include: { movie: true, theatre: true },
        },
        seats: {
          include: { showSeat: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, bookings });
  } catch (err) {
    console.error("Get all bookings error:", err.message);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
};

// 🎫 ADMIN WINDOW BOOKING
export const adminCreateBooking = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { showId, seatIds, paymentType } = req.body;

    if (!showId || !seatIds || seatIds.length === 0 || !paymentType) {
      return res.status(400).json({ message: "showId, seatIds and paymentType are required" });
    }

    if (!["CASH", "CARD"].includes(paymentType)) {
      return res.status(400).json({ message: "paymentType must be CASH or CARD" });
    }

    const show = await prisma.show.findUnique({
      where: { id: showId },
    });

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    if (!show.isActive) {
      return res.status(400).json({ message: "This show has been cancelled" });
    }

    // Add to queue with admin's userId
    const job = await bookingQueue.add(
      "bookSeats",
      {
        userId: adminId,
        showId,
        seatIds,
        paymentType,
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      }
    );

    return res.status(202).json({
      success: true,
      message: paymentType === "CASH"
        ? "Window booking created and marked as PAID"
        : "Window booking queued — proceed to payment",
      jobId: job.id,
    });
  } catch (err) {
    console.error("Admin booking error:", err.message);
    res.status(500).json({ message: "Failed to create window booking" });
  }
};

// ❌ ADMIN CANCEL SHOW + REFUND ALL
export const adminCancelShow = async (req, res) => {
  try {
    const { id } = req.params;

    const show = await prisma.show.findUnique({
      where: { id: parseInt(id) },
      include: {
        movie: true,
        theatre: true,
        bookings: {
          where: { status: "PAID" },
          include: {
            user: true,
            seats: true,
          },
        },
      },
    });

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    if (!show.isActive) {
      return res.status(400).json({ message: "Show already cancelled" });
    }

    // 1. Cancel show + all bookings in transaction
    await prisma.$transaction(async (tx) => {
      await tx.showSeat.updateMany({
        where: { showId: parseInt(id) },
        data: {
          status: "AVAILABLE",
          lockedAt: null,
          pendingBookingId: null,
        },
      });

      await tx.booking.updateMany({
        where: {
          showId: parseInt(id),
          status: { in: ["PENDING", "PAID"] },
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          refundAmount: { set: null },
        },
      });

      await tx.show.update({
        where: { id: parseInt(id) },
        data: { isActive: false },
      });
    });

    // 2. Process bulk refunds for CARD payments (100%)
    await processBulkRefunds(parseInt(id));

    // 3. Send emails to all affected users
    for (const booking of show.bookings) {
      await sendShowCancelledEmail({
        user: booking.user,
        booking,
        show,
        refundAmount: booking.totalAmount,
      });
    }

    res.json({
      message: "Show cancelled successfully",
      affectedBookings: show.bookings.length,
    });
  } catch (err) {
    console.error("Admin cancel show error:", err.message);
    res.status(500).json({ message: "Failed to cancel show" });
  }
};

// ❌ ADMIN CANCEL SPECIFIC BOOKING
export const adminCancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { seatIds } = req.body; // optional — if not provided, cancel all

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        user: true,
        show: {
          include: { movie: true, theatre: true },
        },
        seats: {
          include: { showSeat: true },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    // Use provided seatIds or all seats
    const seatsToCancel = seatIds
      ? booking.seats.filter((bs) => seatIds.includes(bs.showSeatId))
      : booking.seats;

    if (seatsToCancel.length === 0) {
      return res.status(400).json({ message: "No matching seats found" });
    }

    const cancelledAmount = seatsToCancel.reduce((sum, bs) => sum + bs.seatPrice, 0);

    // Admin cancellation → always 100% refund
    const refundAmount = cancelledAmount;

    // Process Stripe refund if CARD
    if (booking.paymentType === "CARD" && booking.paymentId) {
      await processRefund({
        bookingId: booking.id,
        refundAmount,
        paymentId: booking.paymentId,
      });
    }

    // Update seats + booking
    await prisma.$transaction(async (tx) => {
      await tx.showSeat.updateMany({
        where: { id: { in: seatsToCancel.map((bs) => bs.showSeatId) } },
        data: {
          status: "AVAILABLE",
          lockedAt: null,
          pendingBookingId: null,
        },
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

    // Send email
    await sendBookingCancelledEmail({
      user: booking.user,
      booking,
      show: booking.show,
      refundAmount,
      cancelledSeats: seatsToCancel.length,
    });

    return res.json({
      message: booking.paymentType === "CASH"
        ? `Booking cancelled. Customer collects ₹${refundAmount} cash refund.`
        : `Booking cancelled. ₹${refundAmount} refunded to customer.`,
      refundAmount,
      cancelledSeats: seatsToCancel.length,
    });
  } catch (err) {
    console.error("Admin cancel booking error:", err.message);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
};

// ❌ ADMIN CANCEL MOVIE + ALL SHOWS
export const adminCancelMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await prisma.movie.findUnique({
      where: { id: parseInt(id) },
      include: {
        shows: {
          where: { isActive: true },
        },
      },
    });

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    if (movie.shows.length === 0) {
      return res.status(400).json({ message: "No active shows for this movie" });
    }

    // Cancel all active shows
    for (const show of movie.shows) {
      // Get all paid bookings for this show
      const bookings = await prisma.booking.findMany({
        where: { showId: show.id, status: "PAID" },
        include: { user: true, seats: true },
      });

      // Cancel show
      await prisma.$transaction(async (tx) => {
        await tx.showSeat.updateMany({
          where: { showId: show.id },
          data: {
            status: "AVAILABLE",
            lockedAt: null,
            pendingBookingId: null,
          },
        });

        await tx.booking.updateMany({
          where: {
            showId: show.id,
            status: { in: ["PENDING", "PAID"] },
          },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        });

        await tx.show.update({
          where: { id: show.id },
          data: { isActive: false },
        });
      });

      // Process bulk refunds
      await processBulkRefunds(show.id);

      // Send emails
      const fullShow = await prisma.show.findUnique({
        where: { id: show.id },
        include: { movie: true, theatre: true },
      });

      for (const booking of bookings) {
        await sendShowCancelledEmail({
          user: booking.user,
          booking,
          show: fullShow,
          refundAmount: booking.totalAmount,
        });
      }
    }

    res.json({
      message: `Movie cancelled. ${movie.shows.length} shows cancelled.`,
      cancelledShows: movie.shows.length,
    });
  } catch (err) {
    console.error("Admin cancel movie error:", err.message);
    res.status(500).json({ message: "Failed to cancel movie" });
  }
};