import { Router } from "express";
import {
  applyLeave,
  getLeaveApplications,
  updateLeaveStatus,
} from "../controllers/leave.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = Router();

router.post("/", authenticate, applyLeave);
router.get("/", authenticate, getLeaveApplications);
router.patch(
  "/:id/status",
  authenticate,
  authorize(["HR", "MANAGER"]),
  updateLeaveStatus
);

export { router as leaveRoutes };
