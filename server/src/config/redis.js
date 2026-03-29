import "./env.js";
import Redis from "ioredis";

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: false,
    servername: process.env.REDIS_HOST,
  },
  maxRetriesPerRequest: null,
  connectTimeout: 30000,
  commandTimeout: 30000,
  socketTimeout: 30000,
  keepAlive: 10000,
  family: 0,
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