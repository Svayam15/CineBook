import "./env.js";
import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not defined");
}

export function createRedisConnection(isWorker = false) {
  const conn = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 10000,
    ...(isWorker ? {} : { commandTimeout: 10000 }), // ✅ no commandTimeout for worker
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