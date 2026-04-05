import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma.js";
import { validateSignup } from "../utils/validateAuth.js";
import { createAndSendOTP, verifyOTP } from "../services/otp_service.js";
import { checkLoginBlock, recordFailedAttempt, resetLoginAttempts } from "../services/login_attempt_service.js";
import { sendPasswordResetSuccessEmail } from "../services/email_service.js";
import { OTP_TYPE } from "../utils/constants.js";
import { timingSafeEqual } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;

// 🔥 SET COOKIE HELPER
const setAuthCookie = (res, token, stayLoggedIn = false) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: isProduction ? ".svayam.dev" : undefined,
    maxAge: stayLoggedIn
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000,
  });
};

// 📝 SIGNUP — validate + send OTP
export const signup = async (req, res) => {
  try {
    let { name, surname, username, email, password } = req.body;

    username = username?.toLowerCase();
    email = email?.toLowerCase();

    const errors = validateSignup({ name, surname, username, email, password });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({ errors: { username: "Username already taken" } });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ errors: { email: "Email already registered" } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user data temporarily in OTP table
    await createAndSendOTP({
      email,
      type: "SIGNUP",
      userData: { name, surname, username, email, password: hashedPassword },
    });

    return res.json({
      message: "OTP sent to your email. Please verify to complete signup.",
      email,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "Signup failed" });
  }
};

// ✅ VERIFY SIGNUP OTP — create user
export const verifySignup = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const record = await verifyOTP({ email, otp, type: "SIGNUP" });

    // Create user from stored userData
    const { name, surname, username, password } = record.userData;

    const user = await prisma.user.create({
      data: { name, surname, username, email, password },
    });

    // Auto login after signup
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    setAuthCookie(res, token, false);

    return res.status(201).json({
      message: "Account created successfully! Welcome 🎉",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "Signup verification failed" });
  }
};

// 🔐 LOGIN — verify credentials + send OTP
export const login = async (req, res) => {
  try {
    let { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password are required" });
    }

    identifier = identifier.toLowerCase();

    // Check if blocked
    await checkLoginBlock(identifier);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await recordFailedAttempt(user.email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Reset failed attempts on successful password
    await resetLoginAttempts(user.email);

    // Send OTP
    await createAndSendOTP({ email: user.email, type: "LOGIN" });

    return res.json({
      message: "OTP sent to your email. Please verify to complete login.",
      email: user.email,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "Login failed" });
  }
};

// ✅ VERIFY LOGIN OTP
export const verifyLogin = async (req, res) => {
  try {
    const { email, otp, stayLoggedIn } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    await verifyOTP({ email, otp, type: "LOGIN" });

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: stayLoggedIn ? "30d" : "1d" }
    );

    setAuthCookie(res, token, stayLoggedIn);

    return res.json({
      message: "Login successful! 🎉",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "Login verification failed" });
  }
};

// 🔑 FORGOT PASSWORD — send OTP
export const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    email = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return res.json({ message: "If this email exists, an OTP has been sent." });
    }

    await createAndSendOTP({ email, type: "FORGOT_PASSWORD" });

    return res.json({
      message: "OTP sent to your email.",
      email,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

// ✅ RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and new password are required" });
    }

    // Validate new password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,16}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be 8-16 chars with uppercase, lowercase, number and special character",
      });
    }

    await verifyOTP({ email, otp, type: "FORGOT_PASSWORD" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Reset login attempts after password reset
    await resetLoginAttempts(email);

    // Send password reset success email
    await sendPasswordResetSuccessEmail({ user });

    return res.json({ message: "Password reset successfully! Please login." });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "Password reset failed" });
  }
};

// 🔄 RESEND OTP
export const resendOTP = async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ message: "Email and type are required" });
    }

    if (!Object.values(OTP_TYPE).includes(type)) {
      return res.status(400).json({ message: "Invalid OTP type" });
    }

    // For LOGIN resend — verify user exists
    if (type === "LOGIN") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    }

    await createAndSendOTP({ email, type });

    return res.json({ message: "OTP resent successfully." });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

// 🚪 LOGOUT
export const logout = (req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain: isProduction ? ".svayam.dev" : undefined,
  });
  res.json({ message: "Logged out successfully" });
};

// 👑 ADMIN SIGNUP
export const adminSignup = async (req, res) => {
  try {
    const { name, surname, username, email, password, adminSecret } = req.body;

// NEW — replace with this
const provided = Buffer.from(adminSecret ?? "");
const expected = Buffer.from(process.env.ADMIN_SECRET ?? "");
const isValidSecret = provided.length === expected.length && timingSafeEqual(provided, expected);
if (!isValidSecret) {
  return res.status(403).json({ message: "Invalid admin secret" });
}

    let usernameFormatted = username?.toLowerCase();
    let emailFormatted = email?.toLowerCase();

    const errors = validateSignup({ name, surname, username: usernameFormatted, email: emailFormatted, password });
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ errors });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username: usernameFormatted } });
    if (existingUsername) {
      return res.status(400).json({ errors: { username: "Username already taken" } });
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: emailFormatted } });
    if (existingEmail) {
      return res.status(400).json({ errors: { email: "Email already registered" } });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Send OTP for admin signup too
    await createAndSendOTP({
      email: emailFormatted,
      type: "SIGNUP",
      userData: { name, surname, username: usernameFormatted, email: emailFormatted, password: hashedPassword, role: "ADMIN" },
    });

    return res.json({
      message: "OTP sent to your email. Please verify to complete admin signup.",
      email: emailFormatted,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "Admin signup failed" });
  }
};

// ✅ VERIFY ADMIN SIGNUP
export const verifyAdminSignup = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const record = await verifyOTP({ email, otp, type: "SIGNUP" });

    const { name, surname, username, password, role } = record.userData;

    const user = await prisma.user.create({
      data: { name, surname, username, email, password, role: role || "ADMIN" },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    setAuthCookie(res, token, false);

    return res.status(201).json({
      message: "Admin account created successfully! 🎉",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ message: "Admin signup verification failed" });
  }
};