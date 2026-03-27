import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../config/logger.js";

// 🏛️ CREATE THEATRE (ADMIN)
export const createTheatre = asyncHandler(async (req, res) => {
  const { name, location } = req.body;

  if (!name || !location) {
    const error = new Error("Name and location are required");
    error.statusCode = 400;
    throw error;
  }

  const theatre = await prisma.theatre.create({
    data: { name, location },
  });

  logger.info(`Theatre created: ${theatre.name}`);
  res.status(201).json({ message: "Theatre created", theatre });
});

// 🏛️ GET ALL THEATRES (PUBLIC)
export const getTheatres = asyncHandler(async (req, res) => {
  const theatres = await prisma.theatre.findMany({
    orderBy: { name: "asc" },
  });
  res.json(theatres);
});

// 🏛️ GET THEATRE BY ID (PUBLIC)
export const getTheatreById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const theatre = await prisma.theatre.findUnique({
    where: { id: parseInt(id) },
    include: {
      shows: {
        include: { movie: true },
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!theatre) {
    const error = new Error("Theatre not found");
    error.statusCode = 404;
    throw error;
  }

  res.json(theatre);
});

// ✏️ UPDATE THEATRE (ADMIN)
export const updateTheatre = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;

  if (!name && !location) {
    const error = new Error("At least one field (name or location) is required to update");
    error.statusCode = 400;
    throw error;
  }

  const theatre = await prisma.theatre.findUnique({
    where: { id: parseInt(id) },
  });

  if (!theatre) {
    const error = new Error("Theatre not found");
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.theatre.update({
    where: { id: parseInt(id) },
    data: {
      ...(name && { name }),
      ...(location && { location }),
    },
  });

  logger.info(`Theatre updated: ${updated.name}`);
  res.json({ message: "Theatre updated successfully", theatre: updated });
});

// 🏛️ DELETE THEATRE (ADMIN) — fixed rule
export const deleteTheatre = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const theatre = await prisma.theatre.findUnique({
    where: { id: parseInt(id) },
    include: {
      shows: {
        include: { movie: true },
      },
    },
  });

  if (!theatre) {
    const error = new Error("Theatre not found");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();

  // 🚫 Block if any upcoming shows exist
  const hasUpcoming = theatre.shows.some(
    (s) => s.isActive && new Date(s.startTime) > now
  );

  if (hasUpcoming) {
    const error = new Error("Cannot delete theatre with upcoming shows. Cancel all shows first.");
    error.statusCode = 400;
    throw error;
  }

  // 🚫 Block if any show is currently ongoing
  const hasOngoing = theatre.shows.some((s) => {
    if (!s.isActive) return false;
    const start = new Date(s.startTime);
    const end = new Date(start.getTime() + (s.movie?.duration || 0) * 60 * 1000);
    return now >= start && now < end;
  });

  if (hasOngoing) {
    const error = new Error("Cannot delete theatre with an ongoing show.");
    error.statusCode = 400;
    throw error;
  }

  // 🚫 Block if any PENDING bookings exist
  const pendingBooking = await prisma.booking.findFirst({
    where: {
      status: "PENDING",
      show: { theatreId: parseInt(id) },
    },
  });

  if (pendingBooking) {
    const error = new Error("Cannot delete theatre with pending bookings.");
    error.statusCode = 400;
    throw error;
  }

  // 🚫 Block if any PAID booking exists for an upcoming/active show
  // ✅ FIXED: only block for active upcoming paid bookings
  // NOT for old completed show paid history
  const activePaidBooking = await prisma.booking.findFirst({
    where: {
      status: "PAID",
      show: {
        theatreId: parseInt(id),
        isActive: true,
        startTime: { gt: now },
      },
    },
  });

  if (activePaidBooking) {
    const error = new Error("Cannot delete theatre with active paid bookings. Cancel all upcoming shows first.");
    error.statusCode = 400;
    throw error;
  }

  // ✅ Safe to delete — no active financial obligations
  // Clean up in order to avoid FK constraint errors
  await prisma.$transaction(async (tx) => {
    for (const show of theatre.shows) {
      await tx.showSeat.deleteMany({ where: { showId: show.id } });
      await tx.show.delete({ where: { id: show.id } });
    }
    await tx.theatre.delete({ where: { id: parseInt(id) } });
  });

  logger.info(`Theatre deleted: ${theatre.name}`);
  res.json({ success: true, message: "Theatre deleted successfully" });
});