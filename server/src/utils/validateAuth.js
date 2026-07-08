const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[A-Za-z]+$/;          // only alphabets
const phoneRegex = /^\+91[6-9]\d{9}$/;    // Indian mobile only — +91 then 10 digits starting 6-9
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,16}$/;

export const validateSignup = ({
  name,
  surname,
  phone,
  email,
  password,
}) => {
  const errors = {};

  if (!name || name.trim().length === 0) {
    errors.name = "Name is required";
  } else if (!nameRegex.test(name.trim())) {
    errors.name = "Name must contain only alphabets";
  } else if (name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters";
  }

  if (!surname || surname.trim().length === 0) {
    errors.surname = "Surname is required";
  } else if (!nameRegex.test(surname.trim())) {
    errors.surname = "Surname must contain only alphabets";
  }

  // Phone — required, must be a valid Indian mobile number in E.164 format
  if (!phone) {
    errors.phone = "Phone number is required";
  } else if (!phoneRegex.test(phone)) {
    errors.phone =
      "Enter a valid 10-digit Indian mobile number (e.g. +919876543210)";
  }

  // Email
  if (!email) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(email)) {
    errors.email = "Invalid email format";
  }

  // Password
  if (!password) {
    errors.password = "Password is required";
  } else if (!passwordRegex.test(password)) {
    errors.password =
      "Password must be 8–16 chars with uppercase, lowercase, number, and special character";
  }

  return errors;
};

// 🔍 Login identifier helper — used by auth_controller.login to figure out whether
// the user is logging in with email or phone. Anything starting with `+` is treated
// as a phone; anything containing `@` is treated as email.
// Returns { type: "email" | "phone" | "unknown", normalized }.
export const detectIdentifierType = (raw) => {
  if (!raw || typeof raw !== "string") return { type: "unknown", normalized: "" };
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    return { type: "phone", normalized: trimmed };
  }
  if (trimmed.includes("@")) {
    return { type: "email", normalized: trimmed.toLowerCase() };
  }
  return { type: "unknown", normalized: trimmed };
};