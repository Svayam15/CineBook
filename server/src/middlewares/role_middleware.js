// ✅ Admin only
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied: Admin only" });
  }
  next();
};

// ✅ Staff or Admin — for scanning
export const requireStaffOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role !== "STAFF" && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied: Staff or Admin only" });
  }
  next();
};