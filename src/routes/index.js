import express from "express";
import authRoutes from "./auth.routes.js";
import employeeRoutes from "./employee.routes.js";
import { leaveRoutes } from "./leave.routes.js";
import healthRoutes from "./health.routes.js";
import { authenticate, authenticateToken } from "../middlewares/auth.js";

const router = express.Router();

// API Documentation route
router.get("/", (req, res) => {
  res.json({
    name: "ACE HRM API",
    version: "1.0.0",
    description:
      "Backend API for ACE Hospital Human Resource Management System",
    endpoints: {
      auth: "/api/v1/auth",
      employees: "/api/v1/employees",
      leave: "/api/v1/leave",
      health: "/api/v1/health",
    },
    documentation: "/api/v1/docs",
    status: "/api/v1/health",
  });
});

// API v1 routes
const v1Router = express.Router();

// Health check endpoints
v1Router.use("/health", healthRoutes);

v1Router.use("/auth", authRoutes);

v1Router.use("/employees", authenticate, employeeRoutes);
v1Router.use("/leave", authenticateToken, leaveRoutes);

// Mount v1 routes under /api/v1
router.use("/api/v1", v1Router);

export default router;
