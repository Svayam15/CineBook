import express from "express";
import {
  signup,
  verifySignup,
  login,
  verifyLogin,
  forgotPassword,
  resetPassword,
  resendOTP,
  logout,
  adminSignup,
  verifyAdminSignup,
} from "../controllers/auth_controller.js";
import { authLimiter, otpLimiter } from "../middlewares/rateLimiter_middleware.js";

const router = express.Router();

router.post("/signup", authLimiter, signup);
router.post("/verify-signup", authLimiter, verifySignup);
router.post("/login", authLimiter, login);
router.post("/verify-login", authLimiter, verifyLogin);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/resend-otp", otpLimiter, resendOTP);
router.post("/logout", logout);
router.post("/admin-signup", authLimiter, adminSignup);
router.post("/verify-admin-signup", authLimiter, verifyAdminSignup);

export default router;