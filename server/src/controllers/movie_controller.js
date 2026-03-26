import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../config/logger.js";

// 🎬 CREATE MOVIE (ADMIN)
export const createMovie = asyncHandler(async (req, res) => {
  const { title, duration } = req.body;

  if (!title || !duration) {
    const error = new Error("Title and duration are required");
    error.statusCode = 400;
    throw error;
  }

  if (duration <= 0) {
    const error = new Error("Duration must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  const movie = await prisma.movie.create({
    data: { title, duration },
  });

  logger.info(`Movie created: ${movie.title}`);
  res.status(201).json({ message: "Movie created", movie });
});

// 🎬 GET ALL MOVIES (PUBLIC) — exclude soft-deleted
export const getMovies = asyncHandler(async (req, res) => {
  const movies = await prisma.movie.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
  res.json(movies);
});

// 🎬 GET MOVIE BY ID (PUBLIC) — exclude soft-deleted
export const getMovieById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await prisma.movie.findFirst({
    where: {
      id: parseInt(id),
      isDeleted: false,
    },
    include: {
      shows: {
        include: { theatre: true },
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!movie) {
    const error = new Error("Movie not found");
    error.statusCode = 404;
    throw error;
  }

  res.json(movie);
});

// 🎬 DELETE MOVIE (ADMIN) — soft delete
// For movies with upcoming shows, use /admin/movies/:id/cancel instead
export const deleteMovie = asyncHandler(async (req, res) => {
  const movieId = parseInt(req.params.id);

  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
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

  // 🚫 Block if any upcoming shows exist
  const upcomingShow = await prisma.show.findFirst({
    where: {
      movieId,
      isActive: true,
      startTime: { gt: new Date() },
    },
  });

  if (upcomingShow) {
    const error = new Error("Cannot delete movie with upcoming shows. Cancel all shows first.");
    error.statusCode = 400;
    throw error;
  }

  // 🚫 Block if any ongoing show exists (started but not ended)
  const startedShows = await prisma.show.findMany({
    where: {
      movieId,
      isActive: true,
      startTime: { lte: new Date() },
    },
    include: { movie: true },
  });

  const hasOngoing = startedShows.some((show) => {
    const endTime = new Date(show.startTime).getTime() + (show.movie?.duration || 0) * 60 * 1000;
    return Date.now() < endTime;
  });

  if (hasOngoing) {
    const error = new Error("Cannot delete movie with an ongoing show.");
    error.statusCode = 400;
    throw error;
  }

  // 🚫 Block if any pending bookings exist
  const pendingBooking = await prisma.booking.findFirst({
    where: {
      status: "PENDING",
      show: { movieId },
    },
  });

  if (pendingBooking) {
    const error = new Error("Cannot delete movie with pending bookings.");
    error.statusCode = 400;
    throw error;
  }

  // ✅ Soft delete — keeps all show and booking history intact
  await prisma.movie.update({
    where: { id: movieId },
    data: { isDeleted: true },
  });

  logger.info(`Movie soft-deleted: ${movie.title}`);
  res.json({ success: true, message: "Movie deleted successfully" });
});