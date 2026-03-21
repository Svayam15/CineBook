import express from "express";
import {
  createOrder,
  verifyPayment,
  cancelAndRefund,
} from "../controllers/payment_controller.js";
import { handleWebhook } from "../controllers/webhook_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";

const router = express.Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);


router.post("/create-order", authMiddleware, createOrder);
router.post("/verify", authMiddleware, verifyPayment);
router.post("/cancel-refund", authMiddleware, cancelAndRefund); // ← NOW WIRED UP

export default router;