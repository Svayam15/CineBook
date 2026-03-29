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
  connectTimeout: 10000,
  commandTimeout: 10000,
  keepAlive: 30000,        // send keepalive every 30s to prevent socket from going stale
  family: 4,               // force IPv4, more reliable on most cloud providers
  retryStrategy(times) {
    if (times > 20) return null;           // give it more attempts before giving up
    return Math.min(times * 200, 5000);   // exponential backoff, max 5s between retries
  },
  reconnectOnError(err) {
    // force reconnect on these common transient errors
    const targetErrors = ["READONLY", "ECONNRESET", "ETIMEDOUT", "ECONNREFUSED"];
    return targetErrors.some((e) => err.message.includes(e));
  },
});

connection.on("error", (err) => {
  console.error("Redis connection error:", err.message);
});

connection.on("connect", () => {
  console.log("Redis connected successfully");
});

connection.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

export default connection;