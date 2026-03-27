import Stripe from "stripe";
import prisma from "../utils/prisma.js";
import { calculateRefund } from "../services/booking_service.js";
import { processRefund } from "../services/refund_service.js";
import { sendBookingConfirmationEmail } from "../services/email_service.js"; // ← ADD
import logger from "../config/logger.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔥 CREATE PAYMENT INTENT
export const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { show: true },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "PAID") return res.status(400).json({ message: "Booking already paid" });
    if (booking.status === "FAILED") return res.status(400).json({ message: "Booking expired. Please book again." });
    if (booking.status === "CANCELLED") return res.status(400).json({ message: "Booking was cancelled" });
    if (!booking.show.isActive) return res.status(400).json({ message: "This show has been cancelled" });

    const lockedSeats = await prisma.showSeat.findMany({
      where: { pendingBookingId: bookingId, status: "LOCKED" },
    });

    if (lockedSeats.length === 0) {
      return res.status(400).json({ message: "Seat reservation expired. Please book again." });
    }

    const amountInPaise = Math.round(booking.totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: "inr",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { bookingId: String(bookingId) },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      bookingId,
      totalAmount: booking.totalAmount,
      expiresAt: lockedSeats[0].lockedAt
        ? new Date(new Date(lockedSeats[0].lockedAt).getTime() + 15 * 60 * 1000)
        : null,
    });
  } catch (err) {
    logger.error(`Create order error: ${err.message}`);
    return res.status(500).json({ message: "Failed to create payment intent" });
  }
};

// 🔥 VERIFY PAYMENT
export const verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId, bookingId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    const [lockedSeats, booking] = await Promise.all([
      prisma.showSeat.findMany({
        where: { pendingBookingId: bookingId, status: "LOCKED" },
      }),
      prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          show: {
            include: { movie: true, theatre: true }, // ← ADD movie & theatre for email
          },
          user: true, // ← ADD user for email
        },
      }),
    ]);

    if (lockedSeats.length === 0) return res.status(400).json({ message: "Seat reservation expired" });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.showSeat.updateMany({
        where: { pendingBookingId: bookingId },
        data: { status: "BOOKED", lockedAt: null, pendingBookingId: null },
      });

      await tx.bookingSeat.createMany({
        data: lockedSeats.map((seat) => ({
          bookingId,
          showSeatId: seat.id,
          seatType: seat.type,
          seatPrice: seat.type === "GOLDEN"
            ? (booking.show.goldenPrice || 0)
            : booking.show.regularPrice,
        })),
      });

      return tx.booking.update({
        where: { id: bookingId },
        data: { status: "PAID", paymentId: paymentIntentId },
      });
    });

    // ✅ Send booking confirmation email — fetch updated seats for email
    const bookingSeats = await prisma.bookingSeat.findMany({
      where: { bookingId },
      include: { showSeat: true },
    });

    // Fire and forget — don't block response
    sendBookingConfirmationEmail({
      user: booking.user,
      booking: updated,
      show: booking.show,
      seats: bookingSeats,
    }).catch((err) => logger.error(`Confirmation email error: ${err.message}`));

    logger.info(`Payment verified for booking ${bookingId}`);

    return res.json({
      message: "Payment successful! Seats confirmed. 🎉",
      booking: updated,
    });
  } catch (err) {
    logger.error(`Verify payment error: ${err.message}`);
    return res.status(500).json({ message: "Payment verification failed" });
  }
};

// 🔥 CANCEL BOOKING PAYMENT (refund)
export const cancelAndRefund = async (req, res) => {
  try {
    const { bookingId, seatIds } = req.body;
    const cancelledByAdmin = req.user.role === "ADMIN";

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { show: true, seats: true },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "PAID") return res.status(400).json({ message: "Only paid bookings can be refunded" });

    const seatsToCancel = seatIds || booking.seats.map((s) => s.showSeatId);
    const cancelledSeatsData = booking.seats.filter((bs) => seatsToCancel.includes(bs.showSeatId));
    const cancelledAmount = cancelledSeatsData.reduce((sum, bs) => sum + bs.seatPrice, 0);
    const refundAmount = calculateRefund(cancelledAmount, booking.show.startTime, cancelledByAdmin);

    if (booking.paymentType === "CARD" && booking.paymentId) {
      await processRefund({ bookingId, refundAmount, paymentId: booking.paymentId });
    }

    await prisma.$transaction(async (tx) => {
      await tx.showSeat.updateMany({
        where: { id: { in: cancelledSeatsData.map((bs) => bs.showSeatId) } },
        data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
      });

      await tx.bookingSeat.deleteMany({
        where: { bookingId, showSeatId: { in: cancelledSeatsData.map((bs) => bs.showSeatId) } },
      });

      const remainingSeats = booking.seats.length - cancelledSeatsData.length;

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          totalAmount: (booking.totalAmount || 0) - cancelledAmount,
          status: remainingSeats === 0 ? "CANCELLED" : "PAID",
          cancelledAt: remainingSeats === 0 ? new Date() : null,
          refundAmount,
        },
      });
    });

    logger.info(`Booking ${bookingId} cancelled. Refund: ₹${refundAmount}`);

    return res.json({
      message: booking.paymentType === "CASH"
        ? "Booking cancelled. Customer will collect cash refund manually."
        : `Booking cancelled. Refund of ₹${refundAmount} processed.`,
      refundAmount,
      paymentType: booking.paymentType,
    });
  } catch (err) {
    logger.error(`Cancel refund error: ${err.message}`);
    return res.status(500).json({ message: "Failed to cancel booking" });
  }
};