import "./env.js";
import Redis from "ioredis";

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
  throw new Error("Redis environment variables are not defined");
}

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 30000,
  commandTimeout: 30000,
  socketTimeout: 30000,
  keepAlive: 10000,
  family: 4,
  retryStrategy(times) {
    if (times > 5) return null;
    return Math.min(times * 500, 3000);
  },
});

connection.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

connection.on("connect", () => {
  console.log("Redis connected successfully");
});

export default connection;