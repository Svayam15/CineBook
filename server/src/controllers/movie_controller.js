import prisma from "../utils/prisma.js";

// CREATE MOVIE (ADMIN)
export const createMovie = async (req, res) => {
  try {
    const { title, duration } = req.body;

    if (!title || !duration) {
      return res.status(400).json({
        message: "Title and duration are required",
      });
    }

    const movie = await prisma.movie.create({
      data: {
        title,
        duration,
      },
    });

    res.status(201).json({
      message: "Movie created",
      movie,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to create movie",
    });
  }
};

// GET ALL MOVIES (PUBLIC)
export const getMovies = async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(movies);
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch movies",
    });
  }
};

// GET MOVIE BY ID (PUBLIC)
export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await prisma.movie.findUnique({
      where: { id: parseInt(id) },
      include: {
        shows: {
          include: {
            theatre: true,
          },
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    res.json(movie);
  } catch (err) {
    console.error("Get movie error:", err.message);
    res.status(500).json({ message: "Failed to fetch movie" });
  }
};