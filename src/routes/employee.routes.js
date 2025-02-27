import { Router } from "express";
import {
  createEmployee,
  getEmployees,
  getEmployee,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  getEmployeesByTeam
} from "../controllers/employee.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = Router();

// Basic CRUD routes
router.post("/", authenticate, authorize("HR"), createEmployee);
router.get("/", getEmployees);
router.get("/stats", authenticate, getEmployeeStats);
router.get("/team/:teamId", authenticate, getEmployeesByTeam);
router.get("/:id", authenticate, getEmployeeById);
router.put("/:id", authenticate, authorize("HR"), updateEmployee);
router.patch("/:id", authenticate, authorize("HR"), updateEmployee);
router.delete("/:id", authenticate, authorize("HR"), deleteEmployee);

export default router;