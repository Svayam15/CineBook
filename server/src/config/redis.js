import "./env.js";

import Redis from "ioredis";

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: "default",
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
