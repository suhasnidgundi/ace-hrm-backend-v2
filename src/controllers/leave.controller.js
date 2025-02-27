import { db } from "../db/index.js";
import { and, eq } from "drizzle-orm";
import { leave_applications, employees } from "../db/schema.js";
import pkg from "winston";

const { log } = pkg;

export const createLeaveApplication = async (req, res) => {
  try {
    const result = await db
      .insert(leave_applications)
      .values(req.body)
      .execute();
    const insertedId = result.insertId; // Get last inserted ID

    const application = await db
      .select()
      .from(leave_applications)
      .where(eq(leave_applications.id, insertedId));

    res.status(201).json(application[0]); // Return the inserted leave application
  } catch (error) {
    log.error("Leave Controller CreateLeaveApplication : ", error);
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
    log.error("Leave Controller ApplyLeave : ", error);
    res.status(400).json({ error: error.message });
  }
};

export const updateLeaveStatus = async (req, res) => {
  try {
    await db
      .update(leave_applications)
      .set({ status })
      .where(eq(leave_applications.id, id))
      .execute();

    const updatedApplication = await db
      .select()
      .from(leave_applications)
      .where(eq(leave_applications.id, id));

    res.json(updatedApplication[0]); // Return updated leave application
  } catch (error) {
    log.error("Leave Controller UpdateLeaveStatus : ", error);
    res.status(400).json({ error: error.message });
  }
};
