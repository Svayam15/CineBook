import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../config/logger.js";

const formatIST = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getScanValidity = (show) => {
  const now = new Date();
  const startTime = new Date(show.startTime);
  const endTime = new Date(startTime.getTime() + (show.movie?.duration || 120) * 60 * 1000);
  const entryOpenTime = new Date(startTime.getTime() - 2 * 60 * 60 * 1000);

  if (now > endTime) return { valid: false, reason: "SHOW_ENDED" };
  if (now < entryOpenTime) return { valid: false, reason: "TOO_EARLY", entryOpenTime };
  return { valid: true };
};

// 📷 GET BOOKING DETAILS ON SCAN (STAFF + ADMIN)
export const scanTicket = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: {
      user: {
        // ✅ Added email to user select
        select: { id: true, name: true, surname: true, username: true, email: true },
      },
      show: {
        include: {
          movie: true,
          theatre: true,
        },
      },
      seats: {
        include: { showSeat: true },
      },
    },
  });

  if (!booking) {
    return res.status(404).json({
      valid: false,
      reason: "NOT_FOUND",
      message: "Booking not found",
    });
  }

  if (booking.status !== "PAID") {
    return res.status(400).json({
      valid: false,
      reason: "NOT_PAID",
      message: `Booking is ${booking.status.toLowerCase()} — not a paid ticket`,
      booking: {
        id: booking.id,
        status: booking.status,
        user: booking.user,
        show: {
          movie: booking.show?.movie?.title,
          theatre: booking.show?.theatre?.name,
          startTime: formatIST(booking.show?.startTime),
        },
      },
    });
  }

  if (booking.isUsed) {
    return res.status(400).json({
      valid: false,
      reason: "ALREADY_USED",
      message: "This ticket has already been used",
      usedAt: formatIST(booking.usedAt),
      booking: {
        id: booking.id,
        user: booking.user,
        show: {
          movie: booking.show?.movie?.title,
          theatre: booking.show?.theatre?.name,
          startTime: formatIST(booking.show?.startTime),
        },
      },
    });
  }

  const scanValidity = getScanValidity(booking.show);

  if (!scanValidity.valid) {
    if (scanValidity.reason === "SHOW_ENDED") {
      return res.status(400).json({
        valid: false,
        reason: "SHOW_ENDED",
        message: "This show has already ended",
        booking: {
          id: booking.id,
          user: booking.user,
          show: {
            movie: booking.show?.movie?.title,
            theatre: booking.show?.theatre?.name,
            startTime: formatIST(booking.show?.startTime),
          },
        },
      });
    }

    if (scanValidity.reason === "TOO_EARLY") {
      return res.status(400).json({
        valid: false,
        reason: "TOO_EARLY",
        message: `Entry opens at ${formatIST(scanValidity.entryOpenTime)}`,
        entryOpenTime: formatIST(scanValidity.entryOpenTime),
        booking: {
          id: booking.id,
          user: booking.user,
          show: {
            movie: booking.show?.movie?.title,
            theatre: booking.show?.theatre?.name,
            startTime: formatIST(booking.show?.startTime),
          },
        },
      });
    }
  }

  // ✅ Full booking data returned for verification
  return res.json({
    valid: true,
    booking: {
      id: booking.id,
      status: booking.status,
      paymentType: booking.paymentType,
      paymentId: booking.paymentId,        // ✅ NEW
      totalAmount: booking.totalAmount,
      isUsed: booking.isUsed,
      createdAt: formatIST(booking.createdAt), // ✅ NEW — booked on date
      user: booking.user,                  // ✅ now includes email
      show: {
        id: booking.show.id,
        movie: booking.show.movie?.title,
        moviePoster: booking.show.movie?.posterUrl,  // ✅ NEW
        movieRating: booking.show.movie?.rating,
        movieLanguage: booking.show.movie?.language,
        movieGenre: booking.show.movie?.genre,       // ✅ NEW
        movieDuration: booking.show.movie?.duration, // ✅ NEW
        theatre: booking.show.theatre?.name,
        location: booking.show.theatre?.location,
        showType: booking.show.showType,
        startTime: formatIST(booking.show.startTime),
        rawStartTime: booking.show.startTime,
      },
      seats: booking.seats.map((bs) => ({
        row: bs.showSeat?.row,
        number: bs.showSeat?.number,
        type: bs.seatType,
        price: bs.seatPrice,
      })),
    },
  });
});

// ✅ CONFIRM TICKET AS USED (STAFF + ADMIN)
export const confirmTicket = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id: parseInt(bookingId) },
    include: {
      show: { include: { movie: true, theatre: true } },
      user: { select: { name: true, surname: true } },
    },
  });

  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  if (booking.status !== "PAID") {
    return res.status(400).json({ message: "Only paid bookings can be confirmed" });
  }

  if (booking.isUsed) {
    return res.status(400).json({
      message: "Ticket already marked as used",
      usedAt: formatIST(booking.usedAt),
    });
  }

  const updated = await prisma.booking.update({
    where: { id: parseInt(bookingId) },
    data: {
      isUsed: true,
      usedAt: new Date(),
    },
  });

  logger.info(`Ticket confirmed: booking ${bookingId} by staff ${req.user.userId}`);

  return res.json({
    success: true,
    message: "Ticket verified and marked as used",
    bookingId: updated.id,
    usedAt: formatIST(updated.usedAt),
  });
});