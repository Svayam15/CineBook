import prisma from "../utils/prisma.js";
import { generateSeats } from "../utils/generateSeats.js";
import * as seatService from "../services/seat_service.js";
import { processBulkRefunds } from "../services/refund_service.js";
import { sendShowCancelledEmail, sendShowRescheduledEmail } from "../services/email_service.js";
import { ALLOWED_SEAT_COUNTS, SHOW_TYPE } from "../utils/constants.js";
import logger from "../config/logger.js";

// ⏰ Helper — format to 12hr IST
const formatToIST = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// ⏰ Helper — calculate end time
const getEndTime = (startTime, durationMinutes) => {
  return new Date(new Date(startTime).getTime() + durationMinutes * 60 * 1000);
};

// ⏰ Helper — format full show response
const formatShow = (show) => {
  if (!show.startTime) return show;
  const endTime = getEndTime(show.startTime, show.movie?.duration || 0);
  return {
    ...show,
    rawStartTime: show.startTime,
    startTime: formatToIST(show.startTime),
    endTime: formatToIST(endTime),
    createdAt: formatToIST(show.createdAt),
  };
};

// ✅ Helper — check if show has ended
const hasShowEnded = (show) => {
  const endTime = getEndTime(show.startTime, show.movie?.duration || 0);
  return new Date() > endTime;
};

// 🎬 CREATE SHOW (ADMIN)
export const createShow = async (req, res) => {
  try {
    const {
      movieId,
      theatreId,
      startTime,
      totalSeats,
      showType,
      regularPrice,
      hasGoldenSeats,
      goldenSeats,
      goldenPrice,
    } = req.body;

    if (!movieId || !theatreId || !startTime || !totalSeats || !showType || !regularPrice) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!Object.values(SHOW_TYPE).includes(showType)) {
      return res.status(400).json({ message: "showType must be 2D, 3D or 4D" });
    }

    if (!ALLOWED_SEAT_COUNTS.includes(totalSeats)) {
      return res.status(400).json({
        message: "Total seats must be one of: 120, 180, 240, 300",
      });
    }

    if (!startTime.includes("+05:30")) {
      return res.status(400).json({
        message: "startTime must be in IST format (e.g. 2026-04-01T18:00:00+05:30)",
      });
    }

    if (new Date(startTime) <= new Date()) {
      return res.status(400).json({ message: "Start time must be in the future" });
    }

    if (regularPrice <= 0) {
      return res.status(400).json({ message: "Regular price must be greater than 0" });
    }

    if (hasGoldenSeats) {
      if (!goldenSeats || !goldenPrice) {
        return res.status(400).json({ message: "Golden seats count and price are required" });
      }
      if (goldenSeats < 30) {
        return res.status(400).json({ message: "Golden seats must be at least 30" });
      }
      if (goldenSeats > totalSeats) {
        return res.status(400).json({ message: "Golden seats cannot exceed total seats" });
      }
      if (goldenPrice <= regularPrice) {
        return res.status(400).json({ message: "Golden price must be greater than regular price" });
      }
    }

    const show = await prisma.show.create({
      data: {
        movieId,
        theatreId,
        startTime: new Date(startTime),
        totalSeats,
        showType,
        regularPrice,
        hasGoldenSeats: hasGoldenSeats || false,
        goldenSeats: hasGoldenSeats ? goldenSeats : null,
        goldenPrice: hasGoldenSeats ? goldenPrice : null,
      },
    });

    const seats = generateSeats(totalSeats, hasGoldenSeats ? goldenSeats : 0);
    await prisma.showSeat.createMany({
      data: seats.map((seat) => ({
        showId: show.id,
        row: seat.row,
        number: seat.number,
        type: seat.type,
      })),
    });

    res.status(201).json({
      message: "Show created with seats",
      show: {
        id: show.id,
        showType: show.showType,
        totalSeats: show.totalSeats,
        regularPrice: show.regularPrice,
        hasGoldenSeats: show.hasGoldenSeats,
        goldenSeats: show.goldenSeats,
        goldenPrice: show.goldenPrice,
      },
    });
  } catch (err) {
    logger.error(`Create show error: ${err.message}`);
    res.status(500).json({ message: "Failed to create show" });
  }
};

// ✏️ UPDATE SHOW (ADMIN) — only price/showType, only if no bookings yet
export const updateShow = async (req, res) => {
  try {
    const { id } = req.params;
    const { regularPrice, goldenPrice, showType } = req.body;

    if (!regularPrice && !goldenPrice && !showType) {
      return res.status(400).json({
        message: "At least one field (regularPrice, goldenPrice, showType) is required",
      });
    }

    const show = await prisma.show.findUnique({
      where: { id: parseInt(id) },
    });

    if (!show) return res.status(404).json({ message: "Show not found" });

    if (!show.isActive) {
      return res.status(400).json({ message: "Cannot edit a cancelled show" });
    }

    // 🚫 Block if show has already started
    if (new Date(show.startTime) <= new Date()) {
      return res.status(400).json({ message: "Cannot edit a show that has already started" });
    }

    // 🚫 Block if any bookings exist
    const existingBooking = await prisma.booking.findFirst({
      where: {
        showId: parseInt(id),
        status: { in: ["PENDING", "PAID"] },
      },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "Cannot edit a show that already has bookings. Use reschedule instead.",
      });
    }

    if (showType && !Object.values(SHOW_TYPE).includes(showType)) {
      return res.status(400).json({ message: "showType must be 2D, 3D or 4D" });
    }

    if (regularPrice !== undefined && regularPrice <= 0) {
      return res.status(400).json({ message: "Regular price must be greater than 0" });
    }

    if (goldenPrice !== undefined) {
      const effectiveRegularPrice = regularPrice ?? show.regularPrice;
      if (goldenPrice <= effectiveRegularPrice) {
        return res.status(400).json({ message: "Golden price must be greater than regular price" });
      }
    }

    const updated = await prisma.show.update({
      where: { id: parseInt(id) },
      data: {
        ...(regularPrice && { regularPrice }),
        ...(goldenPrice && { goldenPrice }),
        ...(showType && { showType }),
      },
    });

    logger.info(`Show ${id} updated`);
    res.json({ message: "Show updated successfully", show: formatShow(updated) });
  } catch (err) {
    logger.error(`Update show error: ${err.message}`);
    res.status(500).json({ message: "Failed to update show" });
  }
};

// 📅 RESCHEDULE SHOW (ADMIN) — allowed even with bookings, emails sent
export const rescheduleShow = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime } = req.body;

    if (!startTime) {
      return res.status(400).json({ message: "New startTime is required" });
    }

    if (!startTime.includes("+05:30")) {
      return res.status(400).json({
        message: "startTime must be in IST format (e.g. 2026-04-01T18:00:00+05:30)",
      });
    }

    if (new Date(startTime) <= new Date()) {
      return res.status(400).json({ message: "New start time must be in the future" });
    }

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

    if (!show) return res.status(404).json({ message: "Show not found" });

    if (!show.isActive) {
      return res.status(400).json({ message: "Cannot reschedule a cancelled show" });
    }

    // 🚫 Block if show has already started
    if (new Date(show.startTime) <= new Date()) {
      return res.status(400).json({ message: "Cannot reschedule a show that has already started" });
    }

    const oldStartTime = show.startTime;

    // ✅ Update the start time
    const updated = await prisma.show.update({
      where: { id: parseInt(id) },
      data: { startTime: new Date(startTime) },
    });

    // ✅ Notify all paid booked users via email
    for (const booking of show.bookings) {
      sendShowRescheduledEmail({
        user: booking.user,
        booking,
        show: { ...show, startTime: new Date(startTime) },
        oldStartTime,
      }).catch((err) => logger.error(`Reschedule email error: ${err.message}`));
    }

    logger.info(`Show ${id} rescheduled. Notified ${show.bookings.length} users`);

    res.json({
      message: "Show rescheduled successfully",
      notifiedUsers: show.bookings.length,
      show: formatShow({ ...updated, movie: show.movie }),
    });
  } catch (err) {
    logger.error(`Reschedule show error: ${err.message}`);
    res.status(500).json({ message: "Failed to reschedule show" });
  }
};

// 🎬 GET ALL SHOWS (PUBLIC)
export const getShows = async (req, res) => {
  try {
    const shows = await prisma.show.findMany({
      where: {
        isActive: true,
        startTime: { gt: new Date() },
      },
      include: { movie: true, theatre: true },
      orderBy: { startTime: "asc" },
    });
    res.json(shows.map((show) => formatShow(show)));
  } catch (err) {
    logger.error(`Get shows error: ${err.message}`);
    res.status(500).json({ message: "Failed to fetch shows" });
  }
};

// 🎬 GET SHOW BY ID (PUBLIC)
export const getShowById = async (req, res) => {
  try {
    const { id } = req.params;

    const show = await prisma.show.findUnique({
      where: { id: parseInt(id) },
      include: { movie: true, theatre: true },
    });

    if (!show) return res.status(404).json({ message: "Show not found" });
    if (!show.isActive) return res.status(400).json({ message: "This show has been cancelled" });
    if (hasShowEnded(show)) return res.status(400).json({ message: "This show has already ended" });

    res.json(formatShow(show));
  } catch (err) {
    logger.error(`Get show error: ${err.message}`);
    res.status(500).json({ message: "Failed to fetch show" });
  }
};

// 🎬 GET SEATS FOR A SHOW (PUBLIC)
export const getShowSeats = async (req, res) => {
  try {
    const { id } = req.params;

    const show = await prisma.show.findUnique({
      where: { id: parseInt(id) },
      include: { movie: true },
    });

    if (!show) return res.status(404).json({ message: "Show not found" });
    if (!show.isActive) return res.status(400).json({ message: "This show has been cancelled" });
    if (hasShowEnded(show)) return res.status(400).json({ message: "This show has already ended" });

    const seats = await seatService.getShowSeats(id);
    res.json(seats);
  } catch (err) {
    logger.error(`Get seats error: ${err.message}`);
    res.status(500).json({ message: "Failed to fetch seats" });
  }
};

// 🎬 GET AVAILABLE SEATS (PUBLIC)
export const getAvailableSeats = async (req, res) => {
  try {
    const { id } = req.params;

    const show = await prisma.show.findUnique({
      where: { id: parseInt(id) },
      include: { movie: true },
    });

    if (!show) return res.status(404).json({ message: "Show not found" });
    if (!show.isActive) return res.status(400).json({ message: "This show has been cancelled" });
    if (hasShowEnded(show)) return res.status(400).json({ message: "This show has already ended" });

    const seats = await seatService.getAvailableSeats(id);
    res.json(seats);
  } catch (err) {
    logger.error(`Get available seats error: ${err.message}`);
    res.status(500).json({ message: "Failed to fetch available seats" });
  }
};

// 🎬 DELETE SHOW (ADMIN)
export const deleteShow = async (req, res) => {
  try {
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

    if (!show) return res.status(404).json({ message: "Show not found" });
    if (!show.isActive) return res.status(400).json({ message: "Show already cancelled" });

    if (new Date(show.startTime) <= new Date()) {
      return res.status(400).json({ message: "Cannot cancel a show that has already started or ended" });
    }

    await prisma.$transaction(async (tx) => {
      await tx.showSeat.updateMany({
        where: { showId: parseInt(id) },
        data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
      });

      await tx.booking.updateMany({
        where: { showId: parseInt(id), status: { in: ["PENDING", "PAID"] } },
        data: { status: "CANCELLED", cancelledAt: new Date() },
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
      }).catch((err) => logger.error(`Delete show email error: ${err.message}`));
    }

    logger.info(`Show ${id} cancelled`);
    res.json({
      message: "Show cancelled, all bookings cancelled",
      affectedBookings: show.bookings.length,
    });
  } catch (err) {
    logger.error(`Delete show error: ${err.message}`);
    res.status(500).json({ message: "Failed to cancel show" });
  }
};

// 🎬 GET ALL SHOWS (ADMIN)
export const getAdminShows = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const statusFilter = req.query.status?.toUpperCase();

  const now = new Date();

  // ✅ FIXED: filter at DB level, not JS level
  const whereClause = statusFilter === "UPCOMING"
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

  // Handle ONGOING separately since it can't be done purely at DB level
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