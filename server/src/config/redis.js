import "./env.js";
import Redis from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME || "default",
  password: process.env.REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: false,
    servername: process.env.REDIS_HOST,
  },
  maxRetriesPerRequest: null, // Required by BullMQ

  // --- THE STABILITY SYNC ---
  commandTimeout: 0,          // Wait forever for blocking commands (BullMQ needs this)
  connectTimeout: 30000,      // 30s to find the server
  enableReadyCheck: false,    // Upstash doesn't support this
  enableOfflineQueue: true,   // Allow BullMQ to queue commands while connecting
  // ---------------------------

  keepAlive: 30000,
  family: 0,
};

const connection = new Redis(redisConfig);

connection.on("error", (err) => {
  // Ignore 'Command timed out' during startup, it's usually harmless noise
  if (err.message.includes("Command timed out")) return;
  console.error("❌ Redis Error:", err.message);
});

connection.on("connect", () => {
  console.log("🚀 CineBook: Upstash Singapore Connected Successfully");
});

export default connection;