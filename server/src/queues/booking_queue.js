import { Queue } from "bullmq";
import connection from "../config/redis.js";

export const bookingQueue = new Queue("bookingQueue", {
  connection,
  defaultJobOptions: {
    // ✅ Only retry once (prevents explosion)
    attempts: 1,

    // ❌ Removed backoff (not needed for booking)

    // ✅ Clean jobs automatically
    removeOnComplete: true,
    removeOnFail: true,
  },
});