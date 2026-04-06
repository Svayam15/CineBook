const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[A-Za-z]+$/;          // only alphabets
const usernameRegex = /^[a-z0-9_]{3,20}$/;
const usernameHasMinAlphabets = (u) => (u.match(/[a-z]/g) || []).length >= 3;
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

  // NEW
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

 // NEW
if (!username) {
  errors.username = "Username is required";
} else if (!usernameRegex.test(username)) {
  errors.username = "Username must be 3–20 characters and contain only lowercase letters, numbers, and _";
} else if (!usernameHasMinAlphabets(username)) {
  errors.username = "Username must contain at least 3 alphabets";
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