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

// GET ALL MOVIES (PUBLIC)
export const getMovies = asyncHandler(async (req, res) => {
  const movies = await prisma.movie.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(movies);
});

// GET MOVIE BY ID (PUBLIC)
export const getMovieById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await prisma.movie.findUnique({
    where: { id: parseInt(id) },
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