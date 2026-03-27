import Stripe from "stripe";
import prisma from "../utils/prisma.js";
import { sendBookingConfirmationEmail } from "../services/email_service.js";
import logger from "../config/logger.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    logger.error("Webhook: No stripe-signature header");
    return res.status(400).json({ message: "No signature" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  const paymentIntent = event.data.object;
  const bookingId = parseInt(paymentIntent.metadata?.bookingId);

  if (!bookingId) {
    logger.warn(`Webhook: No bookingId in metadata for event ${event.type}`);
    return res.status(200).json({ received: true });
  }

  try {
    switch (event.type) {

      // ✅ PAYMENT SUCCEEDED
      case "payment_intent.succeeded": {
        const booking = await prisma.booking.findUnique({
          where: {id: bookingId},
          include: {
            show: {include: {movie: true, theatre: true}},
            user: true,
          },
        });

        if (!booking) {
          logger.warn(`Webhook: Booking ${bookingId} not found`);
          break;
        }

        // Already paid — idempotency check
        if (booking.status === "PAID") {
          logger.info(`Webhook: Booking ${bookingId} already paid, skipping`);
          break;
        }

        const lockedSeats = await prisma.showSeat.findMany({
          where: {pendingBookingId: bookingId, status: "LOCKED"},
        });

        if (lockedSeats.length === 0) {

          // ✅ Seats may have expired — but payment succeeded
          // Re-lock available seats and confirm booking anyway
          const bookedSeats = await prisma.showSeat.findMany({
            where: {pendingBookingId: bookingId},
          });

          logger.warn(`Webhook: No locked seats for booking ${bookingId}`);

          // Find any seats that were originally for this booking
          // by checking bookingSeat records if they exist
          const existingBookingSeats = await prisma.bookingSeat.findMany({
            where: {bookingId},
          });

          if (existingBookingSeats.length > 0) {
            // BookingSeats already created — just mark as PAID
            await prisma.booking.update({
              where: {id: bookingId},
              data: {status: "PAID", paymentId: paymentIntent.id},
            });
          } else {
            logger.error(`Webhook: Cannot confirm booking ${bookingId} — seats expired and no booking seats found`);
            break;
          }

          break;
        }


        // Confirm booking in transaction
        await prisma.$transaction(async (tx) => {
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

          await tx.booking.update({
            where: { id: bookingId },
            data: {
              status: "PAID",
              paymentId: paymentIntent.id,
            },
          });
        });

        // Send confirmation email
        const bookingSeats = await prisma.bookingSeat.findMany({
          where: { bookingId },
          include: { showSeat: true },
        });

        sendBookingConfirmationEmail({
          user: booking.user,
          booking,
          show: booking.show,
          seats: bookingSeats,
        }).catch((err) => logger.error(`Webhook confirmation email error: ${err.message}`));

        logger.info(`Webhook: Booking ${bookingId} confirmed via webhook ✅`);
        break;
      }

      // ❌ PAYMENT FAILED
      case "payment_intent.payment_failed": {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
        });

        if (!booking || booking.status !== "PENDING") break;

        // Release seats & mark booking as FAILED
        await prisma.$transaction(async (tx) => {
          await tx.showSeat.updateMany({
            where: { pendingBookingId: bookingId },
            data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
          });

          await tx.booking.update({
            where: { id: bookingId },
            data: { status: "FAILED" },
          });
        });

        logger.info(`Webhook: Booking ${bookingId} marked FAILED ❌`);
        break;
      }

      // 🚫 PAYMENT CANCELED
      case "payment_intent.canceled": {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
        });

        if (!booking || booking.status !== "PENDING") break;

        // Release seats & mark booking as FAILED
        await prisma.$transaction(async (tx) => {
          await tx.showSeat.updateMany({
            where: { pendingBookingId: bookingId },
            data: { status: "AVAILABLE", lockedAt: null, pendingBookingId: null },
          });

          await tx.booking.update({
            where: { id: bookingId },
            data: { status: "FAILED" },
          });
        });

        logger.info(`Webhook: Booking ${bookingId} cancelled by customer 🚫`);
        break;
      }

      default:
        logger.warn(`Webhook: Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    logger.error(`Webhook processing error: ${err.message}`);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};