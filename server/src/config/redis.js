// config/redis.js — export a factory function instead of a single instance

import "./env.js";
import Redis from "ioredis";

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
  throw new Error("Redis environment variables are not defined");
}

export function createRedisConnection() {
  const conn = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME || "default",
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    commandTimeout: 10000,
    keepAlive: 30000,
    family: 4,
    retryStrategy(times) {
      if (times > 20) return null;
      return Math.min(times * 200, 5000);
    },
    reconnectOnError(err) {
      const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"];
      return targetErrors.some((e) => err.message.includes(e));
    },
  });

  conn.on("error", (err) => console.error("Redis error:", err.message));
  conn.on("connect", () => console.log("Redis connected"));
  conn.on("reconnecting", () => console.log("Redis reconnecting..."));

  return conn;
}

// default export for any non-BullMQ usage (rate limiter etc.)
export default createRedisConnection();