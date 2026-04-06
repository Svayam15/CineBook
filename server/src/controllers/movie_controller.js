import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../config/logger.js";
import { MOVIE_RATING, LANGUAGES, GENRES, SHOW_TYPE } from "../utils/constants.js";

const VALID_FORMATS = Object.values(SHOW_TYPE); // ["2D", "3D", "4D"]

// ─── Validators ───────────────────────────────────────────────────────────────

const validateLanguages = (languages) => {
  if (!Array.isArray(languages) || languages.length === 0)
    return "At least one language is required";
  const invalid = languages.filter((l) => !LANGUAGES.includes(l));
  if (invalid.length > 0)
    return `Invalid language(s): ${invalid.join(", ")}`;
  return null;
};

const validateGenres = (genres) => {
  if (!Array.isArray(genres) || genres.length === 0)
    return "At least one genre is required";
  if (genres.length > 4)
    return "Maximum 4 genres allowed";
  const invalid = genres.filter((g) => !GENRES.includes(g));
  if (invalid.length > 0)
    return `Invalid genre(s): ${invalid.join(", ")}`;
  return null;
};

const validateFormats = (formats) => {
  if (!Array.isArray(formats) || formats.length === 0)
    return "At least one format (2D/3D/4D) is required";
  const invalid = formats.filter((f) => !VALID_FORMATS.includes(f));
  if (invalid.length > 0)
    return `Invalid format(s): ${invalid.join(", ")}`;
  return null;
};

// 🎬 CREATE MOVIE (ADMIN)
export const createMovie = asyncHandler(async (req, res) => {
  const {
    title,
    duration,
    posterUrl,
    languages,
    formats,
    rating,
    genres,
    description,
    releaseDate,
    director,
    cast,
  } = req.body;

  if (!title || !duration || !posterUrl || !rating || !description || !releaseDate) {
    const error = new Error("Required: title, duration, posterUrl, rating, description, releaseDate");
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

  try { new URL(posterUrl); } catch {
    const error = new Error("posterUrl must be a valid URL");
    error.statusCode = 400;
    throw error;
  }

  const langErr = validateLanguages(languages);
  if (langErr) { const e = new Error(langErr); e.statusCode = 400; throw e; }

  const genreErr = validateGenres(genres);
  if (genreErr) { const e = new Error(genreErr); e.statusCode = 400; throw e; }

  const formatErr = validateFormats(formats);
  if (formatErr) { const e = new Error(formatErr); e.statusCode = 400; throw e; }

  const movie = await prisma.movie.create({
    data: {
      title,
      duration,
      posterUrl,
      languages,
      formats,
      rating,
      genres,
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
    where: { id: parseInt(id), isDeleted: false },
    include: {
      shows: {
        where: { isActive: true, startTime: { gt: new Date() } },
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
    languages,
    formats,
    rating,
    genres,
    description,
    releaseDate,
    director,
    cast,
  } = req.body;

  const movie = await prisma.movie.findUnique({ where: { id: parseInt(id) } });

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
    try { new URL(posterUrl); } catch {
      const error = new Error("posterUrl must be a valid URL");
      error.statusCode = 400;
      throw error;
    }
  }

  if (languages !== undefined) {
    const err = validateLanguages(languages);
    if (err) { const e = new Error(err); e.statusCode = 400; throw e; }
  }

  if (genres !== undefined) {
    const err = validateGenres(genres);
    if (err) { const e = new Error(err); e.statusCode = 400; throw e; }
  }

  if (formats !== undefined) {
    const err = validateFormats(formats);
    if (err) { const e = new Error(err); e.statusCode = 400; throw e; }

    // ✅ If formats change, check existing shows don't use a removed format
    const removedFormats = (movie.formats || []).filter((f) => !formats.includes(f));
    if (removedFormats.length > 0) {
      const conflictShow = await prisma.show.findFirst({
        where: {
          movieId: parseInt(id),
          isActive: true,
          startTime: { gt: new Date() },
          showType: { in: removedFormats },
        },
      });
      if (conflictShow) {
        const error = new Error(
          `Cannot remove format(s) ${removedFormats.join(", ")} — existing upcoming shows use them`
        );
        error.statusCode = 400;
        throw error;
      }
    }
  }

  const startedShow = await prisma.show.findFirst({
    where: { movieId: parseInt(id), isActive: true, startTime: { lte: new Date() } },
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
      ...(languages !== undefined && { languages }),
      ...(formats !== undefined && { formats }),
      ...(rating && { rating }),
      ...(genres !== undefined && { genres }),
      ...(description && { description }),
      ...(releaseDate && { releaseDate: new Date(releaseDate) }),
      ...(director !== undefined && { director: director || null }),
      ...(cast !== undefined && { cast: cast || null }),
    },
  });

  logger.info(`Movie updated: ${updated.title}`);
  res.json({ message: "Movie updated successfully", movie: updated });
});

// ♻️ RESTORE MOVIE (ADMIN)
export const restoreMovie = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const movie = await prisma.movie.findUnique({ where: { id: parseInt(id) } });

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

  const movie = await prisma.movie.findUnique({ where: { id: movieId } });

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
    where: { movieId, isActive: true, startTime: { gt: new Date() } },
  });

  if (upcomingShow) {
    const error = new Error("Cannot delete movie with upcoming shows. Cancel all shows first.");
    error.statusCode = 400;
    throw error;
  }

  const startedShows = await prisma.show.findMany({
    where: { movieId, isActive: true, startTime: { lte: new Date() } },
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
    where: { status: "PENDING", show: { movieId } },
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