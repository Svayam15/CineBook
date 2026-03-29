import "./env.js";
import Redis from "ioredis";

// 1. Validation (Prevents 'Undefined' connection strings from crashing the app)
if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
  throw new Error("❌ Redis environment variables are missing from .env");
}

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: false,
    servername: process.env.REDIS_HOST,
  },
  // --- MANDATORY FOR BULLMQ ---
  maxRetriesPerRequest: null,

  // --- NETWORK STABILITY ---
  connectTimeout: 30000,
  commandTimeout: 0,
  keepAlive: 30000, // 30s is perfect: prevents Render idle-timeouts while saving quota
  family: 0,        // Supports both IPv4 and IPv6
});

// 2. Monitoring (Crucial for debugging the 500k limit)
connection.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

connection.on("connect", () => {
  console.log("🚀 CineBook: Upstash Singapore Connected Successfully");
});

export default connection;