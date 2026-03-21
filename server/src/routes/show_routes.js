import express from "express";

import { createShow, getShowSeats, getAvailableSeats, getShows, getShowById, deleteShow } from "../controllers/show_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";
import { requireAdmin } from "../middlewares/role_middleware.js";


const router = express.Router();

router.post("/", authMiddleware, requireAdmin, createShow);
router.get("/", getShows);              // ← ADD
router.get("/:id", getShowById);
router.get("/:id/seats", getShowSeats);
router.delete("/:id", authMiddleware, requireAdmin, deleteShow);
router.get("/:id/available-seats", getAvailableSeats);

export default router;