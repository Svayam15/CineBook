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
  maxRetriesPerRequest: null,

  // --- THE SURGICAL FIX ---
  commandTimeout: 0,           // 0 means no timeout at all
  connectTimeout: 40000,       // Increase slightly for Singapore TLS handshake
  enableReadyCheck: false,     // Upstash doesn't like this
  enableOfflineQueue: true,    // Keep this true now

  // This prevents ioredis from "timing out" the initialization commands
  offlineQueue: true,
  autoResubscribe: true,
  // ------------------------

  keepAlive: 30000,
  family: 0,
};

const connection = new Redis(redisConfig);

// Silencing the "Command timed out" noise in logs so you can see REAL errors
connection.on("error", (err) => {
  if (err.message.includes("Command timed out")) return;
  console.error("❌ Redis Error:", err.message);
});

connection.on("connect", () => {
  console.log("🚀 CineBook: Upstash Singapore Connected Successfully");
});

export default connection;