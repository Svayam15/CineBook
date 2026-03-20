import express from "express";
import { createBooking, getBookingStatus, getMyBookings, cancelBooking } from "../controllers/booking_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";


const router = express.Router();

// User must be logged in
router.post("/", authMiddleware, createBooking);
router.get("/my-bookings", authMiddleware, getMyBookings);
router.get("/status/:jobId", authMiddleware, getBookingStatus);
router.delete("/:id", authMiddleware, cancelBooking);

export default router;