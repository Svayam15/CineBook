import prisma from "../utils/prisma.js";

export const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        email: true,
        role: true,      // ← ADD role
        createdAt: true, // ← ADD createdAt
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" }); // ← ADD
    }

    res.json(user);
  } catch (err) {
    console.error("Get me error:", err.message); // ← ADD
    res.status(500).json({ message: "Failed to fetch user" });
  }
};