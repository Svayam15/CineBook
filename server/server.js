import "./src/config/env.js";
import app from "./src/app.js";
import "./src/workers/booking_worker.js";
import { releaseExpiredLocks } from "./src/services/booking_service.js";
import { cleanupExpiredOTPs } from "./src/services/otp_service.js";
import prisma from "./src/utils/prisma.js";
import logger from "./src/config/logger.js";

const PORT = process.env.PORT;

if (!PORT) {
  logger.error("PORT is not defined in environment variables");
  process.exit(1);
}

// ✅ FIX: run cleanup immediately on startup (handles locks that expired during downtime)
releaseExpiredLocks().catch((err) =>
  logger.error(`Startup lock release error: ${err.message}`)
);
cleanupExpiredOTPs().catch((err) =>
  logger.error(`Startup OTP cleanup error: ${err.message}`)
);

// ⏱️ Release expired locks every 1 minute
setInterval(() => {
  releaseExpiredLocks().catch((err) =>
    logger.error(`Release locks error: ${err.message}`)
  );
}, 60 * 1000);

// 🧹 Cleanup expired OTPs every 1 hour
setInterval(() => {
  cleanupExpiredOTPs().catch((err) =>
    logger.error(`Cleanup OTPs error: ${err.message}`)
  );
}, 60 * 60 * 1000);

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// ✅ FIX: proper graceful shutdown — wait for in-flight requests, force exit after 10s
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully...");

  server.close(async () => {
    logger.info("HTTP server closed — no more new connections");
    await prisma.$disconnect();
    logger.info("Database disconnected");
    process.exit(0);
  });

  // Force exit after 10 seconds if something hangs
  setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 10000);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down...");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
});