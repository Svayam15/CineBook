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
        where: { isActive: true },
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
      shows: { where: { isActive: true } },
    },
  });

  if (!theatre) {
    const error = new Error("Theatre not found");
    error.statusCode = 404;
    throw error;
  }

  if (theatre.shows.length > 0) {
    const error = new Error("Cannot delete theatre with active shows. Cancel all shows first.");
    error.statusCode = 400;
    throw error;
  }

  await prisma.theatre.delete({ where: { id: parseInt(id) } });

  logger.info(`Theatre deleted: ${theatre.name}`);
  res.json({ message: "Theatre deleted successfully" });
});