import "./src/config/env.js";
import app from "./src/app.js";
import { releaseExpiredLocks } from "./src/services/booking_service.js";
import { cleanupExpiredOTPs } from "./src/services/otp_service.js";

const PORT = process.env.PORT || 5000;

// ⏱️ Release expired locks every 1 minute
setInterval(() => {
  releaseExpiredLocks();
}, 60 * 1000);

// 🧹 Cleanup expired OTPs every 1 hour
setInterval(() => {
  cleanupExpiredOTPs();
}, 60 * 60 * 1000);

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});