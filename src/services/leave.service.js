import { db } from "../db/index.js";
import {
    eq,
    and,
    gte,
    lt,
    desc,
    asc,
    sql
} from "drizzle-orm";
import {
    leave_applications,
    employees,
    leave_types,
    employee_leave_balances
} from "../db/schema.js";
import pkg from "winston";
import { logger } from "../config/logger.js";
class LeaveService {
    /**
     * Apply for leave
     * @param {Object} leaveData - Leave application data
     * @returns {Promise<Object>} Created leave application
     */
    async applyForLeave(leaveData) {
        try {
            // Calculate leave duration in days
            const startDate = new Date(leaveData.startDate);
            const endDate = new Date(leaveData.endDate);
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

            // Check leave balance
            const [leaveBalance] = await db
                .select()
                .from(employee_leave_balances)
                .where(
                    and(
                        eq(employee_leave_balances.employeeId, leaveData.employeeId),
                        eq(employee_leave_balances.leaveTypeId, leaveData.leaveTypeId)
                    )
                );

            if (!leaveBalance || leaveBalance.balance < diffDays) {
                throw new Error("Insufficient leave balance");
            }

            // Create leave application with PENDING status
            const [application] = await db
                .insert(leave_applications)
                .values({
                    employeeId: leaveData.employeeId,
                    leaveTypeId: leaveData.leaveTypeId,
                    startDate: leaveData.startDate,
                    endDate: leaveData.endDate,
                    reason: leaveData.reason || null,
                    status: "PENDING"
                })
                .$returningId();

            return application;
        } catch (error) {
            logger.error("LeaveService ApplyForLeave : ", error);
            throw error;
        }
    }

    /**
     * Get all leave applications with filtering options
     * @param {Object} filters - Optional filters
     * @param {Object} pagination - Pagination options
     * @param {Object} sorting - Sorting options
     * @returns {Promise<Object>} Leave applications and count
     */
    async getLeaveApplications(filters = {}, pagination = {}, sorting = {}) {
        try {
            const { status, employeeId, leaveTypeId, startDate, endDate } = filters;
            const { limit = 10, page = 1 } = pagination;
            const offset = (page - 1) * limit;

            // Build where conditions
            let whereConditions = [];

            if (status) {
                whereConditions.push(eq(leave_applications.status, status));
            }

            if (employeeId) {
                whereConditions.push(eq(leave_applications.employeeId, employeeId));
            }

            if (leaveTypeId) {
                whereConditions.push(eq(leave_applications.leaveTypeId, leaveTypeId));
            }

            if (startDate) {
                whereConditions.push(gte(leave_applications.startDate, startDate));
            }

            if (endDate) {
                whereConditions.push(lt(leave_applications.endDate, endDate));
            }

            // Build query with joins
            const query = db
                .select({
                    id: leave_applications.id,
                    employeeId: leave_applications.employeeId,
                    leaveTypeId: leave_applications.leaveTypeId,
                    leaveTypeName: leave_types.name,
                    startDate: leave_applications.startDate,
                    endDate: leave_applications.endDate,
                    status: leave_applications.status,
                    reason: leave_applications.reason,
                    employeeName: sql`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
                    createdAt: leave_applications.createdAt,
                    updatedAt: leave_applications.updatedAt
                })
                .from(leave_applications)
                .leftJoin(employees, eq(leave_applications.employeeId, employees.id))
                .leftJoin(leave_types, eq(leave_applications.leaveTypeId, leave_types.id));

            // Apply where conditions if any
            if (whereConditions.length > 0) {
                query.where(and(...whereConditions));
            }

            // Apply sorting
            if (sorting.field && sorting.order) {
                if (sorting.order.toUpperCase() === 'DESC') {
                    query.orderBy(desc(leave_applications[sorting.field]));
                } else {
                    query.orderBy(asc(leave_applications[sorting.field]));
                }
            } else {
                // Default sorting by createdAt DESC
                query.orderBy(desc(leave_applications.createdAt));
            }

            // Get total count for pagination
            const countQuery = db
                .select({ count: sql`COUNT(*)` })
                .from(leave_applications);

            if (whereConditions.length > 0) {
                countQuery.where(and(...whereConditions));
            }

            const [{ count }] = await countQuery;

            // Apply pagination
            const applications = await query
                .limit(limit)
                .offset(offset);

            return {
                data: applications,
                count: Number(count),
                total: Number(count),
                page,
                pageCount: Math.ceil(count / limit)
            };
        } catch (error) {
            logger.error("LeaveService GetLeaveApplications : ", error);
            throw error;
        }
    }

    /**
     * Get leave application by ID with employee and leave type details
     * @param {number} id - Leave application ID
     * @returns {Promise<Object>} Leave application details
     */
    async getLeaveApplicationById(id) {
        try {
            const [application] = await db
                .select({
                    id: leave_applications.id,
                    employeeId: leave_applications.employeeId,
                    leaveTypeId: leave_applications.leaveTypeId,
                    leaveTypeName: leave_types.name,
                    startDate: leave_applications.startDate,
                    endDate: leave_applications.endDate,
                    status: leave_applications.status,
                    reason: leave_applications.reason,
                    employeeName: sql`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
                    createdAt: leave_applications.createdAt,
                    updatedAt: leave_applications.updatedAt
                })
                .from(leave_applications)
                .leftJoin(employees, eq(leave_applications.employeeId, employees.id))
                .leftJoin(leave_types, eq(leave_applications.leaveTypeId, leave_types.id))
                .where(eq(leave_applications.id, id));

            if (!application) {
                throw new Error("Leave application not found");
            }

            return application;
        } catch (error) {
            logger.error("LeaveService GetLeaveApplicationById : ", error);
            throw error;
        }
    }

    /**
     * Update leave application status
     * @param {number} id - Leave application ID
     * @param {string} status - New status (APPROVED, REJECTED)
     * @param {number} approverId - ID of the employee who approved/rejected
     * @returns {Promise<Object>} Updated leave application
     */
    async updateLeaveStatus(id, status, approverId) {
        try {
            // Get current leave application
            const [currentApplication] = await db
                .select()
                .from(leave_applications)
                .where(eq(leave_applications.id, id));

            if (!currentApplication) {
                throw new Error("Leave application not found");
            }

            if (currentApplication.status !== "PENDING") {
                throw new Error("Only pending applications can be updated");
            }

            // Calculate leave duration in days
            const startDate = new Date(currentApplication.startDate);
            const endDate = new Date(currentApplication.endDate);
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

            // Begin transaction
            const updatedApplication = await db.transaction(async (tx) => {
                // Update leave application status
                const [updated] = await tx
                    .update(leave_applications)
                    .set({
                        status,
                        approverId,
                        updatedAt: new Date()
                    })
                    .where(eq(leave_applications.id, id))
                    .returning();

                // If approved, update leave balance
                if (status === "APPROVED") {
                    // Get current leave balance
                    const [leaveBalance] = await tx
                        .select()
                        .from(employee_leave_balances)
                        .where(
                            and(
                                eq(employee_leave_balances.employeeId, currentApplication.employeeId),
                                eq(employee_leave_balances.leaveTypeId, currentApplication.leaveTypeId)
                            )
                        );

                    if (!leaveBalance) {
                        throw new Error("Leave balance record not found");
                    }

                    // Update leave balance
                    const newBalance = leaveBalance.balance - diffDays;

                    await tx
                        .update(employee_leave_balances)
                        .set({
                            balance: newBalance,
                            updatedAt: new Date()
                        })
                        .where(eq(employee_leave_balances.id, leaveBalance.id));

                    // Update balance after in leave application
                    await tx
                        .update(leave_applications)
                        .set({
                            balanceAfter: newBalance
                        })
                        .where(eq(leave_applications.id, id));
                }

                return updated;
            });

            return updatedApplication;
        } catch (error) {
            logger.error("LeaveService UpdateLeaveStatus : ", error);
            throw error;
        }
    }

    /**
     * Get leave balances for an employee
     * @param {number} employeeId - Employee ID
     * @returns {Promise<Array>} Leave balances for all leave types
     */
    async getEmployeeLeaveBalances(employeeId) {
        try {
            const balances = await db
                .select({
                    id: employee_leave_balances.id,
                    leaveTypeId: employee_leave_balances.leaveTypeId,
                    leaveTypeName: leave_types.name,
                    balance: employee_leave_balances.balance,
                    maxDays: leave_types.maxDays
                })
                .from(employee_leave_balances)
                .leftJoin(leave_types, eq(employee_leave_balances.leaveTypeId, leave_types.id))
                .where(eq(employee_leave_balances.employeeId, employeeId));

            return balances;
        } catch (error) {
            logger.error("LeaveService GetEmployeeLeaveBalances : ", error);
            throw error;
        }
    }

    /**
     * Cancel leave application (only if it's still in PENDING status)
     * @param {number} id - Leave application ID
     * @param {number} employeeId - Employee ID (for verification)
     * @returns {Promise<Object>} Updated leave application
     */
    async cancelLeaveApplication(id, employeeId) {
        try {
            // Get current application
            const [currentApplication] = await db
                .select()
                .from(leave_applications)
                .where(eq(leave_applications.id, id));

            if (!currentApplication) {
                throw new Error("Leave application not found");
            }

            // Verify the employee owns this application
            if (currentApplication.employeeId !== employeeId) {
                throw new Error("You can only cancel your own leave applications");
            }

            // Verify the application is still pending
            if (currentApplication.status !== "PENDING") {
                throw new Error("Only pending applications can be canceled");
            }

            // Update status to CANCELLED
            const [updatedApplication] = await db
                .update(leave_applications)
                .set({
                    status: "CANCELLED",
                    updatedAt: new Date()
                })
                .where(eq(leave_applications.id, id))
                .returning();

            return updatedApplication;
        } catch (error) {
            logger.error("LeaveService CancelLeaveApplication : ", error);
            throw error;
        }
    }

    /**
     * Get upcoming leaves for calendar view
     * @param {Date} fromDate - Start date range
     * @param {Date} toDate - End date range
     * @returns {Promise<Array>} Approved leave applications in the date range
     */
    async getUpcomingLeaves(fromDate, toDate) {
        try {
            const leaves = await db
                .select({
                    id: leave_applications.id,
                    employeeId: leave_applications.employeeId,
                    employeeName: sql`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
                    leaveTypeName: leave_types.name,
                    startDate: leave_applications.startDate,
                    endDate: leave_applications.endDate
                })
                .from(leave_applications)
                .leftJoin(employees, eq(leave_applications.employeeId, employees.id))
                .leftJoin(leave_types, eq(leave_applications.leaveTypeId, leave_types.id))
                .where(
                    and(
                        eq(leave_applications.status, "APPROVED"),
                        // Either start date or end date falls within the range
                        or(
                            and(
                                gte(leave_applications.startDate, fromDate),
                                lt(leave_applications.startDate, toDate)
                            ),
                            and(
                                gte(leave_applications.endDate, fromDate),
                                lt(leave_applications.endDate, toDate)
                            )
                        )
                    )
                )
                .orderBy(asc(leave_applications.startDate));

            return leaves;
        } catch (error) {
            logger.error("LeaveService GetUpcomingLeaves : ", error);
            throw error;
        }
    }

    /**
     * Get leave statistics for dashboard
     * @returns {Promise<Object>} Leave statistics
     */
    async getLeaveStatistics() {
        try {
            // Get pending applications count
            const [pendingCount] = await db
                .select({ count: sql`COUNT(*)` })
                .from(leave_applications)
                .where(eq(leave_applications.status, "PENDING"));

            // Get approved applications count for current month
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const [approvedThisMonth] = await db
                .select({ count: sql`COUNT(*)` })
                .from(leave_applications)
                .where(
                    and(
                        eq(leave_applications.status, "APPROVED"),
                        gte(leave_applications.startDate, firstDayOfMonth),
                        lt(leave_applications.endDate, lastDayOfMonth)
                    )
                );

            // Get leave type distribution
            const leaveTypeDistribution = await db
                .select({
                    leaveTypeName: leave_types.name,
                    count: sql`COUNT(*)`,
                })
                .from(leave_applications)
                .leftJoin(leave_types, eq(leave_applications.leaveTypeId, leave_types.id))
                .where(eq(leave_applications.status, "APPROVED"))
                .groupBy(leave_types.name);

            return {
                pendingApplications: Number(pendingCount.count),
                approvedThisMonth: Number(approvedThisMonth.count),
                leaveTypeDistribution
            };
        } catch (error) {
            logger.error("LeaveService GetLeaveStatistics : ", error);
            throw error;
        }
    }
}

export const leaveService = new LeaveService();