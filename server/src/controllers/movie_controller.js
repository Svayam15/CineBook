import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../config/logger.js";
import { MOVIE_RATING } from "../utils/constants.js";

// 🎬 CREATE MOVIE (ADMIN)
export const createMovie = asyncHandler(async (req, res) => {
  const {
    title,
    duration,
    posterUrl,
    language,
    rating,
    genre,
    description,
    releaseDate,
    director,
    cast,
  } = req.body;

  // ✅ Validate mandatory fields
  if (!title || !duration || !posterUrl || !language || !rating || !genre || !description || !releaseDate) {
    const error = new Error("All fields are required: title, duration, posterUrl, language, rating, genre, description, releaseDate");
    error.statusCode = 400;
    throw error;
  }

  if (duration <= 0) {
    const error = new Error("Duration must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  if (duration > 600) {
    const error = new Error("Duration cannot exceed 600 minutes");
    error.statusCode = 400;
    throw error;
  }

  if (!Object.values(MOVIE_RATING).includes(rating)) {
    const error = new Error("Rating must be one of: U, UA, A, S");
    error.statusCode = 400;
    throw error;
  }

  // ✅ Validate posterUrl is a valid URL
  try {
    new URL(posterUrl);
  } catch {
    const error = new Error("posterUrl must be a valid URL");
    error.statusCode = 400;
    throw error;
  }

  const movie = await prisma.movie.create({
    data: {
      title,
      duration,
      posterUrl,
      language,
      rating,
      genre,
      description,
      releaseDate: new Date(releaseDate),
      director: director || null,
      cast: cast || null,
    },
  });

  logger.info(`Movie created: ${movie.title}`);
  res.status(201).json({ message: "Movie created", movie });
});

// 🎬 GET ALL MOVIES (PUBLIC)
export const getMovies = asyncHandler(async (req, res) => {
  const movies = await prisma.movie.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
  });
  res.json(movies);
});

// 🎬 GET MOVIE BY ID (PUBLIC)
export const getMovieById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await prisma.movie.findFirst({
    where: {
      id: parseInt(id),
      isDeleted: false,
    },
    include: {
      shows: {
        where: {
          isActive: true,
          startTime: { gt: new Date() },
        },
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

// ✏️ UPDATE MOVIE (ADMIN)
export const updateMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    duration,
    posterUrl,
    language,
    rating,
    genre,
    description,
    releaseDate,
    director,
    cast,
  } = req.body;

  const movie = await prisma.movie.findUnique({
    where: { id: parseInt(id) },
  });

  if (!movie) {
    const error = new Error("Movie not found");
    error.statusCode = 404;
    throw error;
  }

  if (movie.isDeleted) {
    const error = new Error("Cannot edit a deleted movie. Restore it first.");
    error.statusCode = 400;
    throw error;
  }

  if (duration !== undefined && duration <= 0) {
    const error = new Error("Duration must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  if (duration !== undefined && duration > 600) {
    const error = new Error("Duration cannot exceed 600 minutes");
    error.statusCode = 400;
    throw error;
  }

  if (rating && !Object.values(MOVIE_RATING).includes(rating)) {
    const error = new Error("Rating must be one of: U, UA, A, S");
    error.statusCode = 400;
    throw error;
  }

  if (posterUrl) {
    try {
      new URL(posterUrl);
    } catch {
      const error = new Error("posterUrl must be a valid URL");
      error.statusCode = 400;
      throw error;
    }
  }

  const startedShow = await prisma.show.findFirst({
    where: {
      movieId: parseInt(id),
      isActive: true,
      startTime: { lte: new Date() },
    },
  });

  if (startedShow) {
    const error = new Error("Cannot edit a movie that already has started or ongoing shows.");
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.movie.update({
    where: { id: parseInt(id) },
    data: {
      ...(title && { title }),
      ...(duration && { duration }),
      ...(posterUrl && { posterUrl }),
      ...(language && { language }),
      ...(rating && { rating }),
      ...(genre && { genre }),
      ...(description && { description }),
      ...(releaseDate && { releaseDate: new Date(releaseDate) }),
      ...(director !== undefined && { director }),
      ...(cast !== undefined && { cast }),
    },
  });

  logger.info(`Movie updated: ${updated.title}`);
  res.json({ message: "Movie updated successfully", movie: updated });
});

// ♻️ RESTORE MOVIE (ADMIN)
export const restoreMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await prisma.movie.findUnique({
    where: { id: parseInt(id) },
  });

  if (!movie) {
    const error = new Error("Movie not found");
    error.statusCode = 404;
    throw error;
  }

  if (!movie.isDeleted) {
    const error = new Error("Movie is not deleted. Nothing to restore.");
    error.statusCode = 400;
    throw error;
  }

  const restored = await prisma.movie.update({
    where: { id: parseInt(id) },
    data: { isDeleted: false },
  });

  logger.info(`Movie restored: ${restored.title}`);
  res.json({ message: "Movie restored successfully", movie: restored });
});

// 🎬 DELETE MOVIE (ADMIN) — soft delete
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

  await prisma.movie.update({
    where: { id: movieId },
    data: { isDeleted: true },
  });

  logger.info(`Movie soft-deleted: ${movie.title}`);
  res.json({ success: true, message: "Movie deleted successfully" });
});