import prisma from "../utils/prisma.js";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_BLOCK_MINS = 30;

// 🔒 CHECK IF EMAIL IS BLOCKED
export const checkLoginBlock = async (email) => {
  const record = await prisma.loginAttempt.findUnique({
    where: { email },
  });

  if (!record) return;

  if (record.blockedUntil && new Date() < new Date(record.blockedUntil)) {
    const minutesLeft = Math.ceil(
      (new Date(record.blockedUntil) - new Date()) / (1000 * 60)
    );
    const error = new Error(`Too many failed attempts. Try again in ${minutesLeft} minutes.`);
    error.statusCode = 429;
    throw error;
  }
};

// ❌ RECORD FAILED LOGIN ATTEMPT
export const recordFailedAttempt = async (email) => {
  const record = await prisma.loginAttempt.upsert({
    where: { email },
    update: { attempts: { increment: 1 }, updatedAt: new Date() },
    create: { email, attempts: 1 },
  });

  if (record.attempts >= MAX_LOGIN_ATTEMPTS) {
    await prisma.loginAttempt.update({
      where: { email },
      data: {
        blockedUntil: new Date(Date.now() + LOGIN_BLOCK_MINS * 60 * 1000),
      },
    });
  }
};

// ✅ RESET LOGIN ATTEMPTS ON SUCCESS
export const resetLoginAttempts = async (email) => {
  await prisma.loginAttempt.upsert({
    where: { email },
    update: { attempts: 0, blockedUntil: null, updatedAt: new Date() },
    create: { email, attempts: 0 },
  });
};