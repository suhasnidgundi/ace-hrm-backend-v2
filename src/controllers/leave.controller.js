import { db } from "../db/index.js";
import { and, eq } from "drizzle-orm";
import { leave_applications, employees, leave_types } from "../db/schema.js";
import { leaveService } from "../services/leave.service.js";
import { logger } from "../config/logger.js";
/**
 * Create a new leave application
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
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
    logger.error("Leave Controller CreateLeaveApplication : ", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get all leave applications with filters and pagination
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getLeaveApplications = async (req, res) => {
  try {
    // Extract query parameters
    const {
      status,
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      limit = 10,
      page = 1,
      sortField = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    // Build filters object
    const filters = {};
    if (status) filters.status = status;
    if (employeeId) filters.employeeId = Number(employeeId);
    if (leaveTypeId) filters.leaveTypeId = Number(leaveTypeId);
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // Build pagination object
    const pagination = {
      limit: Number(limit),
      page: Number(page)
    };

    // Build sorting object
    const sorting = {
      field: sortField,
      order: sortOrder
    };

    const result = await leaveService.getLeaveApplications(filters, pagination, sorting);
    res.json(result);
  } catch (error) {
    logger.error("Leave Controller GetLeaveApplications : ", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a leave application by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getLeaveApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await leaveService.getLeaveApplicationById(Number(id));
    res.json(application);
  } catch (error) {
    logger.error("Leave Controller GetLeaveApplicationById : ", error);
    res.status(404).json({ error: error.message });
  }
};

/**
 * Apply for leave (create new leave application)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const applyLeave = async (req, res) => {
  try {
    const { employeeId, leaveTypeId, startDate, endDate, reason } = req.body;

    // Validate required fields
    if (!employeeId || !leaveTypeId || !startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required fields: employeeId, leaveTypeId, startDate, endDate"
      });
    }

    const application = await leaveService.applyForLeave({
      employeeId: Number(employeeId),
      leaveTypeId: Number(leaveTypeId),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });

    res.status(201).json(application);
  } catch (error) {
    logger.error("Leave Controller ApplyLeave : ", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Update leave application status (approve or reject)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        error: "Status must be either 'APPROVED' or 'REJECTED'"
      });
    }

    // Get approver ID from authenticated user
    const approverId = req.user.employeeId;

    const updatedApplication = await leaveService.updateLeaveStatus(
      Number(id),
      status,
      approverId
    );

    res.json(updatedApplication);
  } catch (error) {
    logger.error("Leave Controller UpdateLeaveStatus : ", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Cancel a pending leave application
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const cancelLeaveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    // Get employee ID from authenticated user
    const employeeId = req.user.employeeId;

    const updatedApplication = await leaveService.cancelLeaveApplication(
      Number(id),
      employeeId
    );

    res.json(updatedApplication);
  } catch (error) {
    logger.error("Leave Controller CancelLeaveApplication : ", error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get leave balances for current employee
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getMyLeaveBalances = async (req, res) => {
  try {
    // Get employee ID from authenticated user
    const employeeId = req.user.employeeId;

    const balances = await leaveService.getEmployeeLeaveBalances(employeeId);
    res.json(balances);
  } catch (error) {
    logger.error("Leave Controller GetMyLeaveBalances : ", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get leave statistics for dashboard
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getLeaveStatistics = async (req, res) => {
  try {
    const statistics = await leaveService.getLeaveStatistics();
    res.json(statistics);
  } catch (error) {
    logger.error("Leave Controller GetLeaveStatistics : ", error);
    res.status(500).json({ error: error.message });
  }
};