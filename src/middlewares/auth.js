import jwt from "jsonwebtoken";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm"; // You were missing this import
import { CustomError } from "../utils/customError.js";

export const authenticateCandidate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header is present and correctly formatted
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new CustomError("Unauthorized: Token is required", 401);
    }

    const token = authHeader.split(" ")[1]; // Extract token after 'Bearer '
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.email) {
      throw new CustomError("Unauthorized: Invalid token", 403);
    }

    req.candidate = decoded; // Attach the candidate details to the request
    next(); // Continue to the next middleware/controller
  } catch (error) {
    return res.status(error.status || 401).json({
      success: false,
      message: error.message || "Unauthorized access",
    });
  }
};

export const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return res.status(401).json({ error: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
