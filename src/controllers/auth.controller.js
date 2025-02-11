import { db } from "../db/index.js";
import { users, refreshTokens } from "../db/schema.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { redisService } from "../services/redis.service.js";
import { logger } from "../config/logger.js";
import { emailService } from "../services/email.service.js";

// Constants for security settings
export const SALT_ROUNDS = 12;
const PASSWORD_MIN_LENGTH = 8;

// Helper function to validate password strength
const isPasswordValid = (password) => {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    /[A-Z]/.test(password) && // At least one uppercase letter
    /[a-z]/.test(password) && // At least one lowercase letter
    /[0-9]/.test(password) && // At least one number
    /[^A-Za-z0-9]/.test(password) // At least one special character
  );
};

// Helper function to hash password
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};


const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "3d" }
  );

  const refreshToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Validate password
    if (!isPasswordValid(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user and retrieve the inserted ID
    const [newUserId] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        role,
      })
      .$returningId({ id: users.id });

    // Fetch the newly inserted user
    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, newUserId.id))
      .limit(1);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    // Store refresh token in database
    await db.insert(refreshTokens).values({
      user_id: newUserId.id, // Use the ID returned from $returningId()
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password with hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Update last login
    await db
      .update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    // Store refresh token
    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Remove sensitive data
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Validate new password
    if (!isPasswordValid(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long and contain uppercase, lowercase, number, and special character",
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password in database
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const [token] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, refreshToken))
      .limit(1);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Verify expiration
    if (new Date(token.expiresAt) < new Date()) {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired",
      });
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, token.userId))
      .limit(1);

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh tokens error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh tokens",
    });
  }
};

