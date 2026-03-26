import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../config/logger.js";

// CREATE THEATRE (ADMIN)
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

// GET ALL THEATRES (PUBLIC)
export const getTheatres = asyncHandler(async (req, res) => {
  const theatres = await prisma.theatre.findMany({
    orderBy: { name: "asc" },
  });
  res.json(theatres);
});

// GET THEATRE BY ID (PUBLIC)
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

// DELETE THEATRE (ADMIN)
export const deleteTheatre = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const theatre = await prisma.theatre.findUnique({
    where: { id: parseInt(id) },
    include: {
      shows: true,
    },
  });

  if (!theatre) {
    const error = new Error("Theatre not found");
    error.statusCode = 404;
    throw error;
  }

  // ✅ NEW LOGIC: Check only upcoming shows
  const now = new Date();

  const hasUpcomingShows = theatre.shows.some(
    (s) => new Date(s.startTime) > now
  );

  if (hasUpcomingShows) {
    const error = new Error("Cannot delete theatre with upcoming shows.");
    error.statusCode = 400;
    throw error;
  }

  // ✅ Safe deletion (completed shows allowed)
  await prisma.$transaction(async (tx) => {
    for (const show of theatre.shows) {
      // Delete booking seats
      await tx.bookingSeat.deleteMany({
        where: {
          showSeat: {
            showId: show.id,
          },
        },
      });

      // Delete bookings
      await tx.booking.deleteMany({
        where: { showId: show.id },
      });

      // Delete seats
      await tx.showSeat.deleteMany({
        where: { showId: show.id },
      });

      // Delete show
      await tx.show.delete({
        where: { id: show.id },
      });
    }

    // Delete theatre
    await tx.theatre.delete({
      where: { id: parseInt(id) },
    });
  });

  logger.info(`Theatre deleted: ${theatre.name}`);
  res.json({ message: "Theatre deleted successfully" });
});