import express from "express";
import { register, login, changePassword, refreshToken, getMe } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);

// Protected routes
router.get("/me", authenticateToken, getMe);
router.post("/change-password", authenticateToken, changePassword);

export default router;