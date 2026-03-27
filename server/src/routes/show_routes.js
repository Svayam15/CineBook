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
} from "../controllers/show_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";
import {requireAdmin} from "../middlewares/role_middleware.js";

const router = express.Router();

// Public
router.get("/", getShows);
router.get("/:id", getShowById);
router.get("/:id/seats", getShowSeats);
router.get("/:id/seats/available", getAvailableSeats);

// Admin only
router.get("/admin/all", authMiddleware, requireAdmin("ADMIN"), getAdminShows);
router.post("/", authMiddleware, requireAdmin("ADMIN"), createShow);
router.put("/:id", authMiddleware, requireAdmin("ADMIN"), updateShow);                        // ✅ NEW
router.patch("/:id/reschedule", authMiddleware, requireAdmin("ADMIN"), rescheduleShow);       // ✅ NEW
router.delete("/:id", authMiddleware, requireAdmin("ADMIN"), deleteShow);

export default router;