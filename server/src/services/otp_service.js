import prisma from "../utils/prisma.js";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";

const OTP_EXPIRY_MINS = 10;
const MAX_OTP_ATTEMPTS = 3;
const MAX_RESEND_COUNT = 3;
const OTP_BLOCK_MINS = 15;
const RESEND_BLOCK_MINS = 60;

// 🔢 Generate 6 digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// 📧 Send OTP email
const sendOTPEmail = async (email, otp, type) => {
  const subjects = {
    SIGNUP: "🎬 Verify your email - Ticket Booking",
    LOGIN: "🔐 Your login OTP - Ticket Booking",
    FORGOT_PASSWORD: "🔑 Reset your password - Ticket Booking",
  };

  const messages = {
    SIGNUP: `Welcome! Your signup verification OTP is:`,
    LOGIN: `Your login OTP is:`,
    FORGOT_PASSWORD: `Your password reset OTP is:`,
  };

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: subjects[type],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
        <h2>🎬 Ticket Booking System</h2>
        <p>${messages[type]}</p>
        <h1 style="letter-spacing: 8px; color: #e74c3c; font-size: 36px;">${otp}</h1>
        <p>This OTP expires in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });
};

// 🔥 CREATE AND SEND OTP
export const createAndSendOTP = async ({ email, type, userData = null }) => {
  // Check if blocked
  const existing = await prisma.oTP.findFirst({
    where: {
      email,
      type,
      used: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing?.blockedUntil && new Date() < new Date(existing.blockedUntil)) {
    const minutesLeft = Math.ceil(
      (new Date(existing.blockedUntil) - new Date()) / (1000 * 60)
    );
    const error = new Error(`Too many attempts. Try again in ${minutesLeft} minutes.`);
    error.statusCode = 429;
    throw error;
  }

  // Check resend limit
  if (existing && existing.resendCount >= MAX_RESEND_COUNT) {
    const blockedUntil = new Date(Date.now() + RESEND_BLOCK_MINS * 60 * 1000);
    await prisma.oTP.update({
      where: { id: existing.id },
      data: { blockedUntil },
    });
    const error = new Error(`Too many OTP requests. Try again in ${RESEND_BLOCK_MINS} minutes.`);
    error.statusCode = 429;
    throw error;
  }

  // Invalidate previous OTPs
  await prisma.oTP.updateMany({
    where: { email, type, used: false },
    data: { used: true },
  });

  // Generate new OTP
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINS * 60 * 1000);
  const resendCount = existing ? existing.resendCount + 1 : 0;

  // Save to DB
  await prisma.oTP.create({
    data: {
      email,
      otp,
      type,
      expiresAt,
      resendCount,
      userData: userData || undefined,
    },
  });

  // Send email
  await sendOTPEmail(email, otp, type);

  console.log(`📧 OTP sent to ${email} for ${type}`);
};

// ✅ VERIFY OTP
export const verifyOTP = async ({ email, otp, type }) => {
  const record = await prisma.oTP.findFirst({
    where: {
      email,
      type,
      used: false,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    const error = new Error("OTP not found. Please request a new one.");
    error.statusCode = 400;
    throw error;
  }

  // Check if blocked
  if (record.blockedUntil && new Date() < new Date(record.blockedUntil)) {
    const minutesLeft = Math.ceil(
      (new Date(record.blockedUntil) - new Date()) / (1000 * 60)
    );
    const error = new Error(`Too many attempts. Try again in ${minutesLeft} minutes.`);
    error.statusCode = 429;
    throw error;
  }

  // Check expiry
  if (new Date() > new Date(record.expiresAt)) {
    const error = new Error("OTP expired. Please request a new one.");
    error.statusCode = 400;
    throw error;
  }

  // Check OTP
  if (record.otp !== otp) {
    const newAttempts = record.attempts + 1;

    if (newAttempts >= MAX_OTP_ATTEMPTS) {
      // Block for 15 mins
      await prisma.oTP.update({
        where: { id: record.id },
        data: {
          attempts: newAttempts,
          blockedUntil: new Date(Date.now() + OTP_BLOCK_MINS * 60 * 1000),
        },
      });
      const error = new Error(`Too many wrong attempts. Blocked for ${OTP_BLOCK_MINS} minutes.`);
      error.statusCode = 429;
      throw error;
    }

    await prisma.oTP.update({
      where: { id: record.id },
      data: { attempts: newAttempts },
    });

    const remaining = MAX_OTP_ATTEMPTS - newAttempts;
    const error = new Error(`Invalid OTP. ${remaining} attempt(s) remaining.`);
    error.statusCode = 400;
    throw error;
  }

  // Mark as used
  await prisma.oTP.update({
    where: { id: record.id },
    data: { used: true },
  });

  return record;
};

// 🧹 CLEANUP EXPIRED OTPs
export const cleanupExpiredOTPs = async () => {
  try {
    const result = await prisma.oTP.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() }, used: false },
          { used: true, createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      },
    });
    if (result.count > 0) {
      console.log(`🧹 Cleaned up ${result.count} expired OTPs`);
    }
  } catch (err) {
    console.error("OTP cleanup error:", err.message);
  }
};