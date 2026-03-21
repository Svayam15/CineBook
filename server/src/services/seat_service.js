  import prisma from "../utils/prisma.js";
  import {SEAT_STATUS} from "../utils/constants.js";

// 🎯 Get all seats for a show
export const getShowSeats = async (showId) => {
  if (!showId) {
    const error = new Error("showId is required");
    error.statusCode = 400;
    throw error;
  }

    return prisma.showSeat.findMany({
    where: { showId: parseInt(showId) },
    orderBy: [
      { row: "asc" },
      { number: "asc" },
    ],
  });

};


// 🎯 Get only available seats (optional but useful)
export const getAvailableSeats = async (showId) => {
  if (!showId) {
    const error = new Error("showId is required");
    error.statusCode = 400;
    throw error;
  }

   return prisma.showSeat.findMany({
    where: {
      showId: parseInt(showId),
      status: SEAT_STATUS.AVAILABLE,
    },
    orderBy: [
      { row: "asc" },
      { number: "asc" },
    ],
  });
};