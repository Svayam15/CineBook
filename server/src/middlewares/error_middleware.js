const errorMiddleware = (err, req, res, next) => {
  console.error("❌ ERROR:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Prisma errors
  if (err.code === "P2002") {
    statusCode = 400;
    message = "Duplicate field value";
  }

  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found";
  }

  if (err.code === "P2003") {        // ← ADD foreign key error
    statusCode = 400;
    message = "Related record not found";
  }

  // Hide internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === "production") {
    message = "Internal Server Error"; // ← don't leak error details
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorMiddleware;