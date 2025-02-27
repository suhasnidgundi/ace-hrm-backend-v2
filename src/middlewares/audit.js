import { db } from "../db/index.js";
import { audit_logs } from "../db/schema.js";
import pkg from "winston";

const { log } = pkg;

/**
 * Create an audit log entry
 * @param {number} userId - ID of the user performing the action
 * @param {string} action - Action performed (CREATE, UPDATE, DELETE)
 * @param {string} entity - Entity affected (table name)
 * @param {number} entityId - ID of the affected entity
 * @param {Object} oldValues - Previous values (for UPDATE and DELETE)
 * @param {Object} newValues - New values (for CREATE and UPDATE)
 * @returns {Promise<void>}
 */
export const createAuditLog = async (
    userId,
    action,
    entity,
    entityId,
    oldValues = null,
    newValues = null
) => {
    try {
        await db.insert(audit_logs).values({
            userId,
            action,
            entity,
            entityId,
            oldValues,
            newValues,
        });
    } catch (error) {
        log.error("Audit Middleware Creation Error: ", error);
    }
};

/**
 * Middleware to audit changes to leave applications
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
export const auditLeaveChanges = async (req, res, next) => {
    // Store the original response methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Process based on request method
    try {
        if (req.method === "POST") {
            // CREATE - Handle after response is sent
            res.json = function (data) {
                // Restore original method
                res.json = originalJson;

                // Create audit log for new leave application
                if (data && data.id) {
                    createAuditLog(
                        req.user.id,
                        "CREATE",
                        "leave_applications",
                        data.id,
                        null,
                        req.body
                    ).catch(err => {
                        log.error("Audit Leave Create Error: ", err);
                    });
                }

                // Call original method
                return originalJson.call(this, data);
            };
        } else if (req.method === "PATCH" || req.method === "PUT") {
            // UPDATE - Handle before and after
            if (req.params.id) {
                // Get current state before update
                const [currentState] = await db
                    .select()
                    .from(leave_applications)
                    .where(eq(leave_applications.id, req.params.id));

                if (currentState) {
                    // Store current state for later use
                    req.auditData = {
                        oldValues: currentState,
                        entityId: currentState.id
                    };

                    // Override response.json
                    res.json = function (data) {
                        // Restore original method
                        res.json = originalJson;

                        // Create audit log for the update
                        if (data) {
                            createAuditLog(
                                req.user.id,
                                "UPDATE",
                                "leave_applications",
                                req.auditData.entityId,
                                req.auditData.oldValues,
                                data
                            ).catch(err => {
                                log.error("Audit Leave Update Error: ", err);
                            });
                        }

                        // Call original method
                        return originalJson.call(this, data);
                    };
                }
            }
        } else if (req.method === "DELETE") {
            // DELETE - Handle before delete
            if (req.params.id) {
                // Get current state before delete
                const [currentState] = await db
                    .select()
                    .from(leave_applications)
                    .where(eq(leave_applications.id, req.params.id));

                if (currentState) {
                    // Create audit log immediately since the data will be deleted
                    await createAuditLog(
                        req.user.id,
                        "DELETE",
                        "leave_applications",
                        currentState.id,
                        currentState,
                        null
                    );
                }
            }
        }
    } catch (error) {
        log.error("Audit Middleware Error: ", error);
    }

    next();
};