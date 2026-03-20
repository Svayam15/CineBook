import express from "express";
import {
  createTheatre,
  getTheatres,
  getTheatreById,
  deleteTheatre,
} from "../controllers/theatre_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";
import { requireAdmin } from "../middlewares/role_middleware.js";

const router = express.Router();

router.get("/", getTheatres);
router.get("/:id", getTheatreById);
router.post("/", authMiddleware, requireAdmin, createTheatre);
router.delete("/:id", authMiddleware, requireAdmin, deleteTheatre);

export default router;