import { Queue } from "bullmq";
import logger from "../config/logger.js";
import { createRedisConnection } from "../config/redis.js";

export const bookingQueue = new Queue("bookingQueue", {
    connection: createRedisConnection(), // own connection for better isolation and performance
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