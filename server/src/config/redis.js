import "./env.js";
import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not defined");
}

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  connectTimeout: 30000,
  commandTimeout: 30000,
  socketTimeout: 30000,
  keepAlive: 10000,
  family: 0,
  tls: {
    rejectUnauthorized: false,
  },
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