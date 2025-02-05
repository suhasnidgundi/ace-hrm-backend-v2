import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm"; // You were missing this import

export const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  console.log("Token: ", token);

  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded: ", decoded);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.sub));
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: "Invalid token" });
  }
};

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    console.log("Token: ", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded: ", decoded);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.sub)) // Changed from decoded.id to decoded.sub to match your token structure
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    // Remove password from user object
    const { password, ...userWithoutPassword } = user;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token",
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this resource",
      });
    }
    next();
  };
};
