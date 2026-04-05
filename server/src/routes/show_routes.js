import express from "express";
import {
  createShow,
  getShows,
  getShowById,
  getShowSeats,
  getAvailableSeats,
  updateShow,
  rescheduleShow,
  deleteShow,
  getAdminShows,
  seatUpdatesSSE,
} from "../controllers/show_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";
import {requireAdmin} from "../middlewares/role_middleware.js";

const router = express.Router();

// Public
router.get("/", getShows);
router.get("/:id", getShowById);
router.get("/:id/seats", getShowSeats);
router.get("/:id/seats/available", getAvailableSeats);
router.get("/:id/seat-updates", seatUpdatesSSE);

// Admin only
router.get("/admin/all", authMiddleware, requireAdmin, getAdminShows);
router.post("/", authMiddleware, requireAdmin, createShow);
router.put("/:id", authMiddleware, requireAdmin, updateShow);                        // ✅ NEW
router.patch("/:id/reschedule", authMiddleware, requireAdmin, rescheduleShow);       // ✅ NEW
router.delete("/:id", authMiddleware, requireAdmin, deleteShow);

export default router;