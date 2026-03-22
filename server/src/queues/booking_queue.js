import { Queue } from "bullmq";
import connection from "../config/redis.js";

export const bookingQueue = new Queue("bookingQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: false,
    removeOnFail: false,
  },
});