import express from "express";
import {
  getAllUsers,
  deleteUser,
  getAllBookings,
  adminCreateBooking,
  adminCancelShow,
  adminCancelBooking,
  adminCancelMovie,
} from "../controllers/admin_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";
import { requireAdmin } from "../middlewares/role_middleware.js";

const router = express.Router();

// All admin routes require auth + admin role
router.use(authMiddleware, requireAdmin);

// 👥 Users
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

// 📋 Bookings
router.get("/bookings", getAllBookings);
router.post("/bookings", adminCreateBooking);
router.delete("/bookings/:bookingId", adminCancelBooking);

// 🎬 Movie cancellation
router.delete("/movies/:id/cancel", adminCancelMovie);

// 🎭 Show cancellation
router.delete("/shows/:id/cancel", adminCancelShow);

export default router;