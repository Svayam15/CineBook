import "./env.js";
import Redis from "ioredis";

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
  throw new Error("Redis environment variables are not defined");
}

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: process.env.REDIS_USERNAME, // ← from .env now
  password: process.env.REDIS_PASSWORD,
  tls: {
    rejectUnauthorized: false,
    servername: process.env.REDIS_HOST,
  },
  maxRetriesPerRequest: null,
  connectTimeout: 30000,
  commandTimeout: 30000,
  family: 0,
});

export default connection;
