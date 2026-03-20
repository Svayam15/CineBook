export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" }); // ← ADD
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied: Admin only" });
  }

  next(); // ← remove unnecessary try/catch, no async here
};