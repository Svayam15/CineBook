import Stripe from "stripe";
import prisma from "../utils/prisma.js";
import logger from "../config/logger.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 💰 PROCESS STRIPE REFUND
export const processRefund = async ({ bookingId, refundAmount, paymentId }) => {
  try {
    if (!paymentId) {
      logger.warn(`⚠️ No paymentId for booking ${bookingId} — skipping Stripe refund`);
      return null;
    }

    const amountInPaise = Math.round(refundAmount * 100);

    const refund = await stripe.refunds.create({
      payment_intent: paymentId,
      amount: amountInPaise,
    });

    // Save refund details to booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        refundId: refund.id,
        refundAmount,
      },
    });

    logger.info(`✅ Refund processed: ${refund.id} — ₹${refundAmount}`);

    return refund;
  } catch (err) {
    logger.error(`Refund error: ${err.message}`);
    throw new Error("Failed to process refund");
  }
};

// 💰 PROCESS BULK REFUNDS (for show cancellation)
export const processBulkRefunds = async (showId) => {
  try {
    // Get all PAID CARD bookings for this show
    const bookings = await prisma.booking.findMany({
      where: {
        showId,
        status: "PAID",
        paymentType: "CARD",
        paymentId: { not: null },
      },
    });

    logger.info(`💳 Processing ${bookings.length} refunds for show ${showId}`);

    const results = await Promise.allSettled(
      bookings.map((booking) =>
        processRefund({
          bookingId: booking.id,
          refundAmount: booking.totalAmount,
          paymentId: booking.paymentId,
        })
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    logger.info(`✅ Refunds: ${succeeded} succeeded, ${failed} failed`);

    return { succeeded, failed };
  } catch (err) {
    logger.error(`Bulk refund error: ${err.message}`);
    throw new Error("Failed to process bulk refunds");
  }
};