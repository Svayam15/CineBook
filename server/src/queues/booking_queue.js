import { Queue } from "bullmq";
import connection from "../config/redis.js";
import logger from "../config/logger.js";

export const bookingQueue = new Queue("bookingQueue", {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { age: 3600 }, // ✅ 1 hour — consistent with per-job settings
    removeOnFail: { age: 3600 },     // ✅ 1 hour — consistent with per-job settings
  },
  streams: {
    events: {
      maxLen: 100,
    },
  },
});

bookingQueue.on("error", (err) => {
  logger.error(`BookingQueue error: ${err.message}`);
});