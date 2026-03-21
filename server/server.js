import "./src/config/env.js";
import app from "./src/app.js";
import "./src/workers/booking_worker.js";
import { releaseExpiredLocks } from "./src/services/booking_service.js";
import { cleanupExpiredOTPs } from "./src/services/otp_service.js";
import logger from "./src/config/logger.js";

const PORT = process.env.PORT;

if (!PORT) {
  logger.error("PORT is not defined in environment variables");
  process.exit(1);
}

// ⏱️ Release expired locks every 1 minute
setInterval(() => {
  releaseExpiredLocks().catch((err) => logger.error(`Release locks error: ${err.message}`));
}, 60 * 1000);

// 🧹 Cleanup expired OTPs every 1 hour
setInterval(() => {
  cleanupExpiredOTPs().catch((err) => logger.error(`Cleanup OTPs error: ${err.message}`));
}, 60 * 60 * 1000);

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down...");
  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});