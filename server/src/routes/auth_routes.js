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

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-signup", verifySignup);
router.post("/login", login);
router.post("/verify-login", verifyLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/resend-otp", resendOTP);
router.post("/logout", logout);
router.post("/admin-signup", adminSignup);
router.post("/verify-admin-signup", verifyAdminSignup);

export default router;