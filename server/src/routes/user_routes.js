import express from "express";
import { getMe } from "../controllers/user_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";

const router = express.Router();

router.get("/me", authMiddleware, getMe);

export default router;