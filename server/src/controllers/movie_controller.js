import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../config/logger.js";

// CREATE MOVIE (ADMIN)
export const createMovie = asyncHandler(async (req, res) => {
  const { title, duration } = req.body;

  if (!title || !duration) {
    const error = new Error("Title and duration are required");
    error.statusCode = 400;
    throw error;
  }

  const movie = await prisma.movie.create({
    data: { title, duration },
  });

  logger.info(`Movie created: ${movie.title}`);
  res.status(201).json({ message: "Movie created", movie });
});


// GET ALL MOVIES (FILTER DELETED)
export const getMovies = asyncHandler(async (req, res) => {
  const movies = await prisma.movie.findMany({
    where: {
      isDeleted: false, // ✅ added
    },
    orderBy: { createdAt: "desc" },
  });

  res.json(movies);
});


// GET MOVIE BY ID (FILTER DELETED)
export const getMovieById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await prisma.movie.findFirst({
    where: {
      id: parseInt(id),
      isDeleted: false, // ✅ added
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


// DELETE MOVIE (SMART + SOFT DELETE)
export const deleteMovie = asyncHandler(async (req, res) => {
  const movieId = parseInt(req.params.id);

  // 1️⃣ Check movie exists
  const movie = await prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie) {
    const error = new Error("Movie not found");
    error.statusCode = 404;
    throw error;
  }

  // 2️⃣ Check upcoming shows
  const upcomingShow = await prisma.show.findFirst({
    where: {
      movieId,
      startTime: {
        gt: new Date(),
      },
    },
  });

  if (upcomingShow) {
    const error = new Error("Cannot delete movie with upcoming or ongoing shows");
    error.statusCode = 400;
    throw error;
  }

  // 3️⃣ Check active bookings (PENDING only)
  const activeBooking = await prisma.booking.findFirst({
    where: {
      status: "PENDING",
      show: {
        movieId,
      },
    },
  });

  if (activeBooking) {
    const error = new Error("Cannot delete movie with active bookings");
    error.statusCode = 400;
    throw error;
  }

  // 4️⃣ Soft delete
  await prisma.movie.update({
    where: { id: movieId },
    data: {
      isDeleted: true,
    },
  });

  logger.info(`Movie soft-deleted: ${movie.title}`);

  res.json({
    success: true,
    message: "Movie deleted successfully",
  });
});