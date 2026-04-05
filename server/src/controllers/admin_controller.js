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
import bcrypt from "bcryptjs";
import { broadcastToShow } from "../utils/sseManager.js";

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

// 📋 GET ALL BOOKINGS (with pagination + smart filter)
export const getAllBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search?.trim();

  let where = {};

  if (search) {
    const asNumber = parseInt(search);
    const isNumber = !isNaN(asNumber);

    if (isNumber) {
      where = {
        OR: [
          { id: asNumber },
          { userId: asNumber },
        ],
      };
    } else if (search.includes("@") && search.indexOf("@") > 0) {
      where = {
        user: { email: { contains: search, mode: "insensitive" } },
      };
    } else {
      const username = search.startsWith("@") ? search.slice(1) : search;
      where = {
        user: { username: { contains: username, mode: "insensitive" } },
      };
    }
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, username: true, surname: true } },
        show: { include: { movie: true, theatre: true } },
        seats: { include: { showSeat: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where }),
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

  const unavailableSeats = seats.filter((s) => s.status !== "AVAILABLE");
  if (unavailableSeats.length > 0) {
    const error = new Error("Some seats are no longer available");
    error.statusCode = 400;
    throw error;
  }

  const totalAmount = seats.reduce((sum, seat) => {
    if (seat.type === "GOLDEN") return sum + (show.goldenPrice || 0);
    return sum + show.regularPrice;
  }, 0);

  const jobId = `booking-${adminId}-${showId}-${Date.now()}`;

  const job = await bookingQueue.add(
    "bookSeats",
    {
      userId: adminId,
      showId,
      seatIds,
      paymentType,
      isWindowBooking: true,
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

  if (new Date(show.startTime) <= new Date()) {
    const error = new Error("Cannot cancel a show that has already started or ended");
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
  // ✅ No req.body — DELETE requests have nobody. Always cancel all seats.

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

  const seatsToCancel = booking.seats;

  if (seatsToCancel.length === 0) {
    const error = new Error("No seats found for this booking");
    error.statusCode = 400;
    throw error;
  }

  const showStartTime = new Date(booking.show.startTime);
  if (new Date() >= showStartTime) {
    const error = new Error("Cannot cancel a booking after the show has started");
    error.statusCode = 400;
    throw error;
  }

  const refundAmount = seatsToCancel.reduce((sum, bs) => sum + bs.seatPrice, 0);

  if (booking.paymentType === "CARD" && booking.paymentId) {
    await processRefund({ bookingId: booking.id, refundAmount, paymentId: booking.paymentId });
  }

  await prisma.$transaction(async (tx) => {
    await tx.showSeat.updateMany({
      where: { id: { in: seatsToCancel.map((bs) => bs.showSeatId) } },
      data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
    });

    await tx.bookingSeat.deleteMany({
      where: { bookingId: booking.id },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        refundAmount,
        totalAmount: 0,
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

  // ✅ Broadcast AVAILABLE — seats freed up
  seatsToCancel.forEach((bs) => {
    broadcastToShow(booking.showId, { seatId: bs.showSeatId, status: "AVAILABLE" });
  });

  logger.info(`Admin cancelled booking ${bookingId}. Refund: ₹${refundAmount}`);

  return res.json({
    message: booking.paymentType === "CASH"
      ? `Booking cancelled. Customer collects ₹${refundAmount} cash refund.`
      : `Booking cancelled. ₹${refundAmount} refunded to customer.`,
    refundAmount,
    cancelledSeats: seatsToCancel.length,
  });
});

// 🎬 ADMIN CANCEL MOVIE + ALL SHOWS + REFUNDS
export const adminCancelMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const movieId = parseInt(id);

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
    include: {
      shows: {
        where: { isActive: true },
        include: { movie: true },
      },
    },
  });

  if (!movie) {
    const error = new Error("Movie not found");
    error.statusCode = 404;
    throw error;
  }

  if (movie.isDeleted) {
    const error = new Error("Movie already deleted");
    error.statusCode = 400;
    throw error;
  }

  const hasOngoing = movie.shows.some((show) => {
    const start = new Date(show.startTime).getTime();
    const end = start + (show.movie?.duration || 0) * 60 * 1000;
    return Date.now() >= start && Date.now() < end;
  });

  if (hasOngoing) {
    const error = new Error("A show is currently running. Wait for it to finish before deleting.");
    error.statusCode = 400;
    throw error;
  }

  const futureShows = movie.shows.filter(
    (s) => new Date(s.startTime) > new Date()
  );
  const futureShowIds = futureShows.map((s) => s.id);

  // ✅ Get all affected bookings upfront for email notifications
  const affectedBookings = futureShowIds.length > 0
    ? await prisma.booking.findMany({
        where: {
          showId: { in: futureShowIds },
          status: "PAID",
        },
        include: { user: true, seats: true },
      })
    : [];

  // ✅ Single transaction for ALL shows instead of N transactions
  if (futureShowIds.length > 0) {
    await prisma.$transaction(async (tx) => {
      await tx.showSeat.updateMany({
        where: { showId: { in: futureShowIds } },
        data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
      });
      await tx.booking.updateMany({
        where: {
          showId: { in: futureShowIds },
          status: { in: ["PENDING", "PAID"] },
        },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      await tx.show.updateMany({
        where: { id: { in: futureShowIds } },
        data: { isActive: false },
      });
    });

    // ✅ Process all refunds in parallel
    await Promise.allSettled(
      futureShowIds.map((showId) => processBulkRefunds(showId))
    );
  }

  // Soft delete the movie
  await prisma.movie.update({
    where: { id: movieId },
    data: { isDeleted: true },
  });

  // Fetch full show details for emails
  const fullShows = futureShowIds.length > 0
    ? await prisma.show.findMany({
        where: { id: { in: futureShowIds } },
        include: { movie: true, theatre: true },
      })
    : [];

  const showMap = Object.fromEntries(fullShows.map((s) => [s.id, s]));

  // Send emails non-blocking
  for (const booking of affectedBookings) {
    const show = showMap[booking.showId];
    if (!show) continue;
    sendShowCancelledEmail({
      user: booking.user,
      booking,
      show,
      refundAmount: booking.totalAmount,
    }).catch((err) => logger.error(`Movie cancel email error: ${err.message}`));
  }

  logger.info(`Movie ${movieId} soft-deleted. ${futureShows.length} future shows cancelled.`);

  res.json({
    message: `Movie deleted successfully. ${futureShows.length} upcoming shows cancelled.`,
    cancelledShows: futureShows.length,
  });
});

// 🎬 GET ALL SHOWS (ADMIN)
export const getAdminShows = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const statusFilter = req.query.status?.toUpperCase();

  const now = new Date();

  const whereClause =
    statusFilter === "UPCOMING"
      ? { startTime: { gt: now } }
      : statusFilter === "COMPLETED"
      ? { startTime: { lt: now } }
      : {};

  const [shows, total] = await Promise.all([
    prisma.show.findMany({
      where: whereClause,
      include: { movie: true, theatre: true },
      orderBy: { startTime: "asc" },
      skip,
      take: limit,
    }),
    prisma.show.count({ where: whereClause }),
  ]);

  const getStatus = (show) => {
    const start = new Date(show.startTime);
    const end = new Date(start.getTime() + (show.movie?.duration || 0) * 60 * 1000);
    if (now < start) return "UPCOMING";
    if (now >= start && now < end) return "ONGOING";
    return "COMPLETED";
  };

  let enriched = shows.map((show) => ({ ...show, status: getStatus(show) }));

  if (statusFilter === "ONGOING") {
    enriched = enriched.filter((s) => s.status === "ONGOING");
  }

  res.json({
    success: true,
    shows: enriched,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// 📊 DASHBOARD STATS
export const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalMovies,
    totalTheatres,
    totalUsers,
    totalBookings,
    revenueAgg,
    allActiveShows,
    todayBookings,
    todayRevenueAgg,
  ] = await Promise.all([
    prisma.movie.count({ where: { isDeleted: false } }),
    prisma.theatre.count(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.booking.count(),
    prisma.booking.aggregate({
      where: { status: "PAID" },
      _sum: { totalAmount: true },
    }),
    prisma.show.findMany({
      where: { isActive: true },
      include: { movie: { select: { duration: true } } },
    }),
    prisma.booking.count({
      where: { createdAt: { gte: startOfDay } },
    }),
    prisma.booking.aggregate({
      where: { status: "PAID", createdAt: { gte: startOfDay } },
      _sum: { totalAmount: true },
    }),
  ]);

  const totalRevenue = revenueAgg._sum.totalAmount ?? 0;
  const todayRevenue = todayRevenueAgg._sum.totalAmount ?? 0;

  const upcomingShows = allActiveShows.filter((s) => new Date(s.startTime) > now).length;
  const ongoingShows = allActiveShows.filter((s) => {
    const start = new Date(s.startTime);
    const end = new Date(start.getTime() + (s.movie?.duration || 0) * 60 * 1000);
    return now >= start && now < end;
  }).length;
  const completedShows = allActiveShows.filter((s) => {
    const start = new Date(s.startTime);
    const end = new Date(start.getTime() + (s.movie?.duration || 0) * 60 * 1000);
    return now >= end;
  }).length;

  res.json({
    success: true,
    stats: {
      totalMovies,
      totalTheatres,
      totalUsers,
      totalBookings,
      totalRevenue,
      upcomingShows,
      ongoingShows,
      completedShows,
      todayBookings,
      todayRevenue,
    },
  });
});

// 👷 CREATE STAFF ACCOUNT (ADMIN ONLY)
export const createStaff = asyncHandler(async (req, res) => {
  const { name, surname, username, email, password } = req.body;

  if (!name || !surname || !username || !email || !password) {
    const error = new Error("All fields are required: name, surname, username, email, password");
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error("Password must be at least 6 characters");
    error.statusCode = 400;
    throw error;
  }

  // Check if email or username already exists
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existing) {
    const error = new Error(
      existing.email === email
        ? "Email already in use"
        : "Username already taken"
    );
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const staff = await prisma.user.create({
    data: {
      name,
      surname,
      username,
      email,
      password: hashedPassword,
      role: "STAFF",
    },
    select: {
      id: true,
      name: true,
      surname: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  logger.info(`Staff account created: ${staff.email} by admin ${req.user.userId}`);

  res.status(201).json({
    success: true,
    message: "Staff account created successfully",
    staff,
  });
});