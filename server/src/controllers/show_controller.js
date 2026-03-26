import prisma from "../utils/prisma.js";
import { generateSeats } from "../utils/generateSeats.js";
import * as seatService from "../services/seat_service.js";
import { processBulkRefunds } from "../services/refund_service.js";
import { sendShowCancelledEmail } from "../services/email_service.js";
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

// ⏰ Helper — calculate end time from startTime + duration in minutes
const getEndTime = (startTime, durationMinutes) => {
  return new Date(new Date(startTime).getTime() + durationMinutes * 60 * 1000);
};

// ⏰ Helper — format full show response with IST times
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

    // Validate required fields
    if (!movieId || !theatreId || !startTime || !totalSeats || !showType || !regularPrice) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate showType
    if (!Object.values(SHOW_TYPE).includes(showType)) {
      return res.status(400).json({ message: "showType must be 2D, 3D or 4D" });
    }

    // Validate totalSeats
    if (!ALLOWED_SEAT_COUNTS.includes(totalSeats)) {
      return res.status(400).json({
        message: "Total seats must be one of: 120, 180, 240, 300",
      });
    }

    // Validate IST format
    if (!startTime.includes("+05:30")) {
      return res.status(400).json({
        message: "startTime must be in IST format (e.g. 2026-04-01T18:00:00+05:30)",
      });
    }

    // Validate startTime is in the future
    if (new Date(startTime) <= new Date()) {
      return res.status(400).json({ message: "Start time must be in the future" });
    }

    // Validate regularPrice
    if (regularPrice <= 0) {
      return res.status(400).json({ message: "Regular price must be greater than 0" });
    }

    // Validate golden seats if enabled
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

    // Create show
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

    // Generate and insert seats
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

// 🎬 GET ALL SHOWS (PUBLIC) — only upcoming active shows
export const getShows = async (req, res) => {
  try {
    const shows = await prisma.show.findMany({
      where: {
        isActive: true,
        startTime: { gt: new Date() }, // ✅ only future shows visible to users
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
      include: { movie: true, theatre: true }, // ✅ movie needed for duration check
    });

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    if (!show.isActive) {
      return res.status(400).json({ message: "This show has been cancelled" });
    }

    // ✅ Block access if show has already ended
    if (hasShowEnded(show)) {
      return res.status(400).json({ message: "This show has already ended" });
    }

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
      include: { movie: true }, // ✅ needed for duration check
    });

    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    if (!show.isActive) {
      return res.status(400).json({ message: "This show has been cancelled" });
    }

    // ✅ Block if show has ended
    if (hasShowEnded(show)) {
      return res.status(400).json({ message: "This show has already ended" });
    }

    const seats = await seatService.getShowSeats(id);
    res.json(seats);
  } catch (err) {
    logger.error(`Get seats error: ${err.message}`);
    res.status(500).json({ message: "Failed to fetch seats" });
  }
};

// 🎬 GET AVAILABLE SEATS FOR A SHOW (PUBLIC)
export const getAvailableSeats = async (req, res) => {
  try {
    const { id } = req.params;

    const show = await prisma.show.findUnique({
      where: { id: parseInt(id) },
      include: { movie: true }, // ✅ needed for duration check
    });

    if (!show) return res.status(404).json({ message: "Show not found" });

    if (!show.isActive) {
      return res.status(400).json({ message: "This show has been cancelled" });
    }

    // ✅ Block if show has ended
    if (hasShowEnded(show)) {
      return res.status(400).json({ message: "This show has already ended" });
    }

    const seats = await seatService.getAvailableSeats(id);
    res.json(seats);
  } catch (err) {
    logger.error(`Get available seats error: ${err.message}`);
    res.status(500).json({ message: "Failed to fetch available seats" });
  }
};

// 🎬 DELETE SHOW (ADMIN) — soft cancel, refund all paid bookings
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

    // 🚫 Cannot cancel ongoing or completed shows
    if (new Date(show.startTime) <= new Date()) {
      return res.status(400).json({ message: "Cannot cancel a show that has already started or ended" });
    }

    await prisma.$transaction(async (tx) => {
      // Release all locked/booked seats
      await tx.showSeat.updateMany({
        where: { showId: parseInt(id) },
        data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
      });

      // Cancel all pending and paid bookings
      await tx.booking.updateMany({
        where: { showId: parseInt(id), status: { in: ["PENDING", "PAID"] } },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });

      // Soft delete the show
      await tx.show.update({
        where: { id: parseInt(id) },
        data: { isActive: false },
      });
    });

    // Process refunds for all paid bookings
    await processBulkRefunds(parseInt(id));

    // Send cancellation emails
    for (const booking of show.bookings) {
      sendShowCancelledEmail({
        user: booking.user,
        booking,
        show,
        refundAmount: booking.totalAmount,
      }).catch((err) => logger.error(`Delete show email error: ${err.message}`));
    }

    logger.info(`Show ${id} cancelled. Affected bookings: ${show.bookings.length}`);

    res.json({
      message: "Show cancelled, all bookings cancelled",
      affectedBookings: show.bookings.length,
    });
  } catch (err) {
    logger.error(`Delete show error: ${err.message}`);
    res.status(500).json({ message: "Failed to cancel show" });
  }
};