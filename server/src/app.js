import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth_routes.js";
import userRoutes from "./routes/user_routes.js";
import movieRoutes from "./routes/movie_routes.js";
import showRoutes from "./routes/show_routes.js";
import bookingRoutes from "./routes/booking_routes.js";
import paymentRoutes from "./routes/payment_routes.js";
import theatreRoutes from "./routes/theatre_routes.js";
import adminRoutes from "./routes/admin_routes.js";
import errorMiddleware from "./middlewares/error_middleware.js";
import { globalLimiter } from "./middlewares/rateLimiter_middleware.js";
import { authMiddleware } from "./middlewares/auth_middleware.js";
import { requireAdmin } from "./middlewares/role_middleware.js";
import serverAdapter from "./config/bullBoard.js";
import logger from "./config/logger.js";

const app = express();

// 🔒 Helmet
app.use(helmet());

// 🌐 CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",");

if (!allowedOrigins || allowedOrigins.length === 0) {
  logger.error("ALLOWED_ORIGINS is not defined in environment variables");
  process.exit(1);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// 🌐 Global rate limiter
app.use(globalLimiter);

// ⚠️ Raw body for Stripe webhook — MUST be before express.json()
app.use((req, res, next) => {
  if (req.originalUrl === "/payment/webhook") {
    next();
  } else {
    express.json({ limit: "10kb" })(req, res, next);
  }
});

app.use(cookieParser());

// 🛣️ Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/movies", movieRoutes);
app.use("/shows", showRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payment", paymentRoutes);
app.use("/theatres", theatreRoutes);
app.use("/admin", adminRoutes);

// 🐂 Bull Board — admin only
app.use(
  "/admin/queues",
  authMiddleware,
  requireAdmin,
  serverAdapter.getRouter()
);

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "API is running 🚀" });
});

// ❌ 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorMiddleware);

export default app;