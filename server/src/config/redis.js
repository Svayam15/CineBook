import "./env.js";
import Redis from "ioredis";

// 1. Validation (Prevents 'Undefined' connection strings from crashing the app)
if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
  throw new Error("❌ Redis environment variables are missing from .env");
}

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME || "default",
  tls: { servername: process.env.REDIS_HOST },

  // --- THE ULTIMATE STABILITY SETTINGS ---
  maxRetriesPerRequest: null,   // Required by BullMQ
  commandTimeout: 0,            // Disable timeout for blocking commands
  connectTimeout: 30000,        // 30s to establish connection
  enableReadyCheck: false,      // Upstash doesn't support the READY check
  enableOfflineQueue: false,    // Fixes timeouts if commands are sent before 'connect'
  // ----------------------------------------

  keepAlive: 30000,
  family: 0,
});


// 2. Monitoring (Crucial for debugging the 500k limit)
connection.on("error", (err) => {
  console.error("❌ Redis Error:", err.message);
});

connection.on("connect", () => {
  console.log("🚀 CineBook: Upstash Singapore Connected Successfully");
});

export default connection;