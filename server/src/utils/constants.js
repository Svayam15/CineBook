export const SEAT_TYPE = {
  REGULAR: "REGULAR",
  GOLDEN: "GOLDEN",
};

export const SHOW_TYPE = {
  TWO_D: "2D",
  THREE_D: "3D",
  FOUR_D: "4D",
};

export const LOCK_EXPIRY_TIME = 10 * 60 * 1000; // 10 mins

export const MAX_SEATS_PER_BOOKING = 10;

export const ALLOWED_SEAT_COUNTS = [120, 180, 240, 300];

export const CANCELLATION_HOURS_FULL_REFUND = 24;
export const CANCELLATION_HOURS_PARTIAL_REFUND = 4;

export const OTP_TYPE = {
  SIGNUP: "SIGNUP",
  LOGIN: "LOGIN",
  FORGOT_PASSWORD: "FORGOT_PASSWORD",
};

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

// ✅ NEW
export const MOVIE_RATING = {
  U: "U",
  UA: "UA",
  A: "A",
  S: "S",
};

export const MOVIE_RATING_LABELS = {
  U: "U - Universal",
  UA: "UA - Parental Guidance",
  A: "A - Adults Only",
  S: "S - Special",
};

export const LANGUAGES = [
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Punjabi",
  "Other",
];

export const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Biography",
  "Documentary",
  "Other",
];