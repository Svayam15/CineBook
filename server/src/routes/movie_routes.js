import express from "express";
import { createMovie, getMovies, getMovieById } from "../controllers/movie_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";
import { requireAdmin } from "../middlewares/role_middleware.js";

const router = express.Router();

// Admin only
router.post("/", authMiddleware, requireAdmin, createMovie);

// Public
router.get("/", getMovies);

//Public
router.get("/:id", getMovieById);

export default router;