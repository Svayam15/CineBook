import { Queue } from "bullmq";
import connection from "../config/redis.js";

export const bookingQueue = new Queue("bookingQueue", {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { age: 300 },
    removeOnFail: { age: 600 },
  },
  streams: {
    events: {
      maxLen: 100,
    },
  },
});