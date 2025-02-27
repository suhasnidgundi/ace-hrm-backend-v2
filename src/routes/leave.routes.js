import { Router } from "express";
import {
  applyLeave,
  getLeaveApplications,
  getLeaveApplicationById,
  updateLeaveStatus,
  cancelLeaveApplication,
  getMyLeaveBalances,
  getLeaveStatistics
} from "../controllers/leave.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = Router();


// Employee routes
router.post("/apply", authenticate, applyLeave);
router.get("/my-balances", authenticate, getMyLeaveBalances);
router.patch("/:id/cancel", authenticate, cancelLeaveApplication);

// HR and Manager routes
router.get("/", authenticate, authorize("HR", "MANAGER"), getLeaveApplications);
router.get("/statistics", authenticate, authorize("HR", "MANAGER"), getLeaveStatistics);
router.get("/:id", authenticate, getLeaveApplicationById);
router.patch("/:id/status", authenticate, authorize("HR", "MANAGER"), updateLeaveStatus);

export { router as leaveRoutes };