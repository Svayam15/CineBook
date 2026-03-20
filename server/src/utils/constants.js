export const SEAT_STATUS = {
  AVAILABLE: "AVAILABLE",
  LOCKED: "LOCKED",
  BOOKED: "BOOKED",
};

export const BOOKING_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
};

export const PAYMENT_TYPE = {
  CASH: "CASH",
  CARD: "CARD",
};

export const SEAT_TYPE = {
  REGULAR: "REGULAR",
  GOLDEN: "GOLDEN",
};

export const SHOW_TYPE = {
  TWO_D: "TWO_D",
  THREE_D: "THREE_D",
  FOUR_D: "FOUR_D",
};

export const LOCK_EXPIRY_TIME = 10 * 60 * 1000; // 10 mins

export const MAX_SEATS_PER_BOOKING = 10;

export const ALLOWED_SEAT_COUNTS = [120, 150, 180, 200, 250, 300];

export const CANCELLATION_HOURS_THRESHOLD = 3; // hours before show

export const CANCELLATION_FEE_PERCENT = 10; // 10% fee