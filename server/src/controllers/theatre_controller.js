import prisma from "../utils/prisma.js";

// CREATE THEATRE (ADMIN)
export const createTheatre = async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: "Name and location are required" });
    }

    const theatre = await prisma.theatre.create({
      data: { name, location },
    });

    res.status(201).json({ message: "Theatre created", theatre });
  } catch (err) {
    console.error("Create theatre error:", err.message);
    res.status(500).json({ message: "Failed to create theatre" });
  }
};

// GET ALL THEATRES (PUBLIC)
export const getTheatres = async (req, res) => {
  try {
    const theatres = await prisma.theatre.findMany({
      orderBy: { name: "asc" },
    });
    res.json(theatres);
  } catch (err) {
    console.error("Get theatres error:", err.message);
    res.status(500).json({ message: "Failed to fetch theatres" });
  }
};

// GET THEATRE BY ID (PUBLIC)
export const getTheatreById = async (req, res) => {
  try {
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
      return res.status(404).json({ message: "Theatre not found" });
    }

    res.json(theatre);
  } catch (err) {
    console.error("Get theatre error:", err.message);
    res.status(500).json({ message: "Failed to fetch theatre" });
  }
};

// DELETE THEATRE (ADMIN)
export const deleteTheatre = async (req, res) => {
  try {
    const { id } = req.params;

    const theatre = await prisma.theatre.findUnique({
      where: { id: parseInt(id) },
      include: {
        shows: {
          where: { isActive: true },
        },
      },
    });

    if (!theatre) {
      return res.status(404).json({ message: "Theatre not found" });
    }

    if (theatre.shows.length > 0) {
      return res.status(400).json({
        message: "Cannot delete theatre with active shows. Cancel all shows first.",
      });
    }

    await prisma.theatre.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: "Theatre deleted successfully" });
  } catch (err) {
    console.error("Delete theatre error:", err.message);
    res.status(500).json({ message: "Failed to delete theatre" });
  }
};