import { Router } from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employee.controller.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = Router();

router.post("/", authenticate, authorize("HR"), createEmployee);
router.get("/", getEmployees);
router.get("/:id", authenticate, getEmployeeById);
router.patch("/:id", authenticate, authorize("HR"), updateEmployee);
router.delete("/:id", authenticate, authorize("HR"), deleteEmployee);

export default router;
