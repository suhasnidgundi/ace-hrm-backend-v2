// src/routes/auth.routes.js
import { Router } from "express";
import {
  login,
  register,
  changePassword,
  refreshToken,
} from "../controllers/auth.controller.js";
import { authenticateToken, authorize } from "../middlewares/auth.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);

// Protected routes
router.post("/change-password", authenticateToken, changePassword);

// Example of role-based route (if you need it)
router.get("/admin-only", authenticateToken, authorize("ADMIN"), (req, res) =>
  res.json({ message: "Admin access granted" })
);

export default router;
