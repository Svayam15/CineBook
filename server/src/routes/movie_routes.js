import express from "express";
import {
  createMovie,
  getMovies,
  getMovieById,
  updateMovie,
  restoreMovie,
  deleteMovie,
} from "../controllers/movie_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";
import { requireAdmin } from "../middlewares/role_middleware.js";

const router = express.Router();

// Public
router.get("/", getMovies);
router.get("/:id", getMovieById);

// Admin only
router.post("/", authMiddleware, requireAdmin, createMovie);
router.put("/:id", authMiddleware, requireAdmin, updateMovie);               // ✅ NEW
router.patch("/:id/restore", authMiddleware, requireAdmin, restoreMovie);    // ✅ NEW
router.delete("/:id", authMiddleware, requireAdmin, deleteMovie);

export default router;