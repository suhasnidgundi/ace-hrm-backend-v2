import { db } from "../db/index.js";
import { and, eq } from "drizzle-orm";
import { leave_applications, employees } from "../db/schema.js";

export const createLeaveApplication = async (req, res) => {
  try {
    const [application] = await db
      .insert(leave_applications)
      .values(req.body)
      .returning();
    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getLeaveApplications = async (req, res) => {
  try {
    const applications = await db
      .select()
      .from(leave_applications)
      .leftJoin(employees, eq(leave_applications.employeeId, employees.id));
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const applyLeave = async (req, res) => {
  try {
    const { employeeId, startDate, endDate, leaveType, reason } = req.body;
    const [application] = await db
      .insert(leave_applications)
      .values({
        employeeId,
        startDate,
        endDate,
        leaveType,
        reason,
        status: "PENDING",
      })
      .returning();
    res.status(201).json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const [application] = await db
      .update(leave_applications)
      .set({ status })
      .where(eq("id", id))
      .returning();
    res.json(application);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
