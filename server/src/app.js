import express from "express";
import cors from "cors";
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

const app = express();

// 🔒 Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));
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