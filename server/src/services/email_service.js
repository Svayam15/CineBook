import { Resend } from "resend";
import logger from "../config/logger.js";

const resend = new Resend(process.env.RESEND_API_KEY);

if (!process.env.FROM_EMAIL) {
  throw new Error("FROM_EMAIL is not defined in environment variables");
}

const FROM_EMAIL = process.env.FROM_EMAIL;

// 🎟️ BOOKING CONFIRMED + PAYMENT SUCCESSFUL
export const sendBookingConfirmationEmail = async ({ user, booking, show, seats }) => {
  try {
    const seatList = seats
      .map((s) => `Row ${s.showSeat.row} - Seat ${s.showSeat.number} (${s.seatType})`)
      .join("\n");

    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `🎬 Booking Confirmed - ${show.movie.title}`,
      html: `
        <h2>Booking Confirmed! 🎉</h2>
        <p>Hi ${user.name},</p>
        <p>Your booking for <strong>${show.movie.title}</strong> is confirmed!</p>
        <hr/>
        <h3>Booking Details:</h3>
        <p><strong>Movie:</strong> ${show.movie.title} (${show.showType})</p>
        <p><strong>Theatre:</strong> ${show.theatre.name}, ${show.theatre.location}</p>
        <p><strong>Date & Time:</strong> ${new Date(show.startTime).toLocaleString()}</p>
        <p><strong>Seats:</strong></p>
        <pre>${seatList}</pre>
        <p><strong>Total Paid:</strong> ₹${booking.totalAmount}</p>
        <p><strong>Payment ID:</strong> ${booking.paymentId || "CASH"}</p>
        <hr/>
        <p>Enjoy the movie! 🍿</p>
      `,
    });

    logger.info(`📧 Booking confirmation email sent to ${user.email}`);
  } catch (err) {
    logger.error(`Email error (booking confirmation): ${err.message}`);
  }
};

// ❌ SHOW CANCELLED BY ADMIN
export const sendShowCancelledEmail = async ({ user, booking, show, refundAmount }) => {
  try {

    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `❌ Show Cancelled - ${show.movie.title}`,
      html: `
        <h2>Show Cancelled</h2>
        <p>Hi ${user.name},</p>
        <p>We regret to inform you that the following show has been cancelled:</p>
        <hr/>
        <h3>Show Details:</h3>
        <p><strong>Movie:</strong> ${show.movie.title}</p>
        <p><strong>Theatre:</strong> ${show.theatre.name}, ${show.theatre.location}</p>
        <p><strong>Date & Time:</strong> ${new Date(show.startTime).toLocaleString()}</p>
        <hr/>
        <h3>Refund Details:</h3>
        ${booking.paymentType === "CARD"
          ? `<p><strong>Refund Amount:</strong> ₹${refundAmount} (100% refund)</p>
             <p>Refund will be credited to your original payment method within 5-7 business days.</p>`
          : `<p>You paid via <strong>CASH</strong>. Please visit the theatre to collect your refund of ₹${refundAmount}.</p>`
        }
        <hr/>
        <p>We apologize for the inconvenience. 🙏</p>
      `,
    });

    logger.info(`📧 Show cancelled email sent to ${user.email}`);
  } catch (err) {
    logger.error(`Email error (show cancelled): ${err.message}`);
  }
};

// 🔄 BOOKING CANCELLED BY USER
export const sendBookingCancelledEmail = async ({ user, booking, show, refundAmount, cancelledSeats }) => {
  try {
    const now = new Date();
    const showTime = new Date(show.startTime);
    const hoursRemaining = (showTime - now) / (1000 * 60 * 60);

    // ✅ Fixed to match actual refund policy: 24hrs/4hrs tiers
    let refundPolicyText = "";
    if (hoursRemaining >= 24) {
      refundPolicyText = "✅ Full refund applied (cancelled more than 24 hours before show)";
    } else if (hoursRemaining >= 4) {
      refundPolicyText = "⚠️ 50% refund applied (cancelled between 4-24 hours before show)";
    } else {
      refundPolicyText = "❌ No refund (cancelled less than 4 hours before show)";
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: `🔄 Booking Cancelled - ${show.movie.title}`,
      html: `
        <h2>Booking Cancelled</h2>
        <p>Hi ${user.name},</p>
        <p>Your booking cancellation for <strong>${show.movie.title}</strong> has been processed.</p>
        <hr/>
        <h3>Cancelled Seats: ${cancelledSeats}</h3>
        <h3>Refund Details:</h3>
        ${booking.paymentType === "CARD"
          ? `
            <p><strong>Refund Amount:</strong> ₹${refundAmount}</p>
            <p>${refundPolicyText}</p>
            ${refundAmount > 0
              ? `<p>Refund will be credited to your original payment method within 5-7 business days.</p>`
              : ""
            }
          `
          : refundAmount > 0
            ? `<p>You paid via <strong>CASH</strong>. Please visit the theatre to collect your refund of ₹${refundAmount}.</p>`
            : `<p>No refund applicable as per cancellation policy.</p>`
        }
        <hr/>
        <p>Thank you for using CineBook! 🎬</p>
      `,
    });

    logger.info(`📧 Booking cancelled email sent to ${user.email}`);
  } catch (err) {
    logger.error(`Email error (booking cancelled): ${err.message}`);
  }
};

// 🔑 PASSWORD RESET SUCCESSFUL
export const sendPasswordResetSuccessEmail = async ({ user }) => {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: "🔑 Password Reset Successful - Ticket Booking",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
          <h2>🎬 Ticket Booking System</h2>
          <h3>Password Reset Successful ✅</h3>
          <p>Hi ${user.name},</p>
          <p>Your password has been reset successfully.</p>
          <p>Please <strong>login again</strong> with your new password.</p>
          <hr/>
          <p>If you did not reset your password, please contact support immediately.</p>
        </div>
      `,
    });
    logger.info(`📧 Password reset success email sent to ${user.email}`);
  } catch (err) {
    logger.error(`Email error (password reset success): ${err.message}`);
  }
};

// 📅 SHOW RESCHEDULED EMAIL
export const sendShowRescheduledEmail = async ({ user, booking, show, oldStartTime }) => {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: user.email,
      subject: `Show Rescheduled — ${show.movie?.title}`,
      html: `
        <h2>Show Rescheduled</h2>
        <p>Hi ${user.name},</p>
        <p>The show you booked has been rescheduled.</p>
        <table>
          <tr><td><strong>Movie</strong></td><td>${show.movie?.title}</td></tr>
          <tr><td><strong>Theatre</strong></td><td>${show.theatre?.name}, ${show.theatre?.location}</td></tr>
          <tr><td><strong>Old Time</strong></td><td>${new Date(oldStartTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true })}</td></tr>
          <tr><td><strong>New Time</strong></td><td>${new Date(show.startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: true })}</td></tr>
          <tr><td><strong>Booking ID</strong></td><td>#${booking.id}</td></tr>
        </table>
        <p>Your seats remain confirmed. Sorry for the inconvenience.</p>
        <p>— CineBook Team</p>
      `,
    });
  } catch (err) {
    logger.error(`Reschedule email failed: ${err.message}`);
  }
};
