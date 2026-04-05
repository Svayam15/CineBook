import express from "express";
import {
  createBooking,
  getBookingStatus,
  getMyBookings,
  cancelBooking,
  getBookingStatusRest
} from "../controllers/booking_controller.js";

import {
  scanTicket,
  confirmTicket,
} from "../controllers/scan_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";
import { requireStaffOrAdmin } from "../middlewares/role_middleware.js";
import { bookingLimiter } from "../middlewares/rateLimiter_middleware.js";


const router = express.Router();

router.post("/", authMiddleware, bookingLimiter, createBooking);
router.get("/my-bookings", authMiddleware, getMyBookings);
router.get("/status-rest/:jobId", authMiddleware, getBookingStatusRest);
router.get("/status/:jobId", authMiddleware, getBookingStatus);
router.delete("/:id", authMiddleware, cancelBooking);

// ✅ Scan routes — Staff + Admin
router.get("/scan/:bookingId", authMiddleware, requireStaffOrAdmin, scanTicket);
router.post("/scan/:bookingId/confirm", authMiddleware, requireStaffOrAdmin, confirmTicket);


export default router;