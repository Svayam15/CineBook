import express from "express";
import {
  createTheatre,
  getTheatres,
  getTheatreById,
  updateTheatre,
  deleteTheatre,
} from "../controllers/theatre_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";
import { requireAdmin } from "../middlewares/role_middleware.js";

const router = express.Router();

// Public
router.get("/", getTheatres);
router.get("/:id", getTheatreById);

// Admin only
router.post("/", authMiddleware, requireAdmin, createTheatre);
router.put("/:id", authMiddleware, requireAdmin, updateTheatre);       // ✅ NEW
router.delete("/:id", authMiddleware, requireAdmin, deleteTheatre);

export default router;