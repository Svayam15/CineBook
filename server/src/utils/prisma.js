import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"], // ← logs in dev
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma; // ← prevents multiple instances on hot reload
}

export default prisma;