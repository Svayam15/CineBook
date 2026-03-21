const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-z0-9_]{3,20}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,16}$/;

export const validateSignup = ({
  name,
  surname,
  username,
  email,
  password,
}) => {
  const errors = {};

  // Name
  if (!name || name.trim().length < 3) {
    errors.name = "Name must be at least 3 characters";
  }

  // Surname
  if (!surname || surname.trim().length < 1) {
    errors.surname = "Surname is required";
  }

  // Username
  if (!username) {
    errors.username = "Username is required";
  } else if (!usernameRegex.test(username)) {
    errors.username =
      "Username must be at least 3 characters and contain only lowercase letters, numbers, and _";
  }

  // Email
  if (!email) {
    errors.email = "Email is required";
  } else if (!emailRegex.test(email)) {
    errors.email = "Invalid email format";
  }

  // Password
  if (!password) {
    errors.password = "Password is required"; }
  else if (!passwordRegex.test(password)) {
    errors.password =
      "Password must be 8–16 chars with uppercase, lowercase, number, and special character";
  }

  return errors;
};