import prisma from "../utils/prisma.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getMe = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      surname: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  res.json(user);
});