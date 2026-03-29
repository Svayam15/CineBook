import { Queue } from "bullmq";
import connection from "../config/redis.js";

export const bookingQueue = new Queue("bookingQueue", {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: { age: 300 }, // keep 5 mins
    removeOnFail: { age: 600 },     // keep 10 mins
  },
});