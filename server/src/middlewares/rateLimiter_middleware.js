import rateLimit from "express-rate-limit";

// 🌐 Global limiter — all routes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🔐 Auth limiter — stricter for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many auth attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 📧 OTP limiter — very strict
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: "Too many OTP requests, please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🎟️ Booking limiter
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: "Too many booking requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});