import { db } from "../db/index.js";
import { 
  employees, 
  employee_professional_details as employeeProfessionalDetails, 
  employee_contacts as employeeContacts, 
  departments, 
  designations,
  users,
  teams
} from "../db/schema.js";
import { eq, and, or, like, sql, not, asc, desc } from "drizzle-orm";
import { logger } from "../config/logger.js";

class EmployeeService {
  /**
   * Create a new employee record
   * @param {Object} employeeData - Employee data to create
   * @returns {Promise<Object>} Newly created employee
   */
  async createEmployee(employeeData) {
    try {
      const result = await db.insert(employees)
        .values(employeeData)
        .execute();

      const insertedId = result.insertId;

      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, insertedId));

      logger.info(`Employee created successfully with ID: ${insertedId}`);
      return employee[0];
    } catch (error) {
      logger.error('EmployeeService CreateEmployee:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get paginated list of employees with optional filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {Object} options.filter - Filter criteria
   * @param {string} options.sort - Sort field
   * @param {string} options.order - Sort order (asc/desc)
   * @param {string} options.search - Search term
   * @param {string} options.role - Filter by role (Employee/Manager)
   * @returns {Promise<Object>} Paginated employees data
   */
  async getEmployees({ page = 1, limit = 10, filter = {}, sort = 'createdAt', order = 'desc', search = '', role = null }) {
    try {
      const offset = (page - 1) * limit;
      
      // Build the where condition based on filters
      let whereConditions = [];
      
      // Add search condition if provided
      if (search) {
        whereConditions.push(
          or(
            like(employees.firstName, `%${search}%`),
            like(employees.lastName, `%${search}%`),
            like(employees.empId, `%${search}%`)
          )
        );
      }
      
      // Add role filter if provided
      if (role) {
        // This assumes you have a role field in the employees table or join with users table
        // This would need to be adjusted based on your actual schema
        const usersTable = await db
          .select({
            id: users.id,
            role: users.role
          })
          .from(users);
        
        // Find employee IDs with the specified role
        const employeeIdsWithRole = usersTable
          .filter(user => user.role === role)
          .map(user => user.id);
        
        if (employeeIdsWithRole.length > 0) {
          whereConditions.push(
            sql`${employees.userId} IN (${employeeIdsWithRole.join(',')})`
          );
        } else {
          // If no users have this role, return no results
          return {
            data: [],
            count: 0,
            total: 0,
            page: page,
            pageCount: 0
          };
        }
      }
      
      // Add additional filters if provided
      if (Object.keys(filter).length > 0) {
        for (const [key, value] of Object.entries(filter)) {
          if (employees[key]) {
            whereConditions.push(eq(employees[key], value));
          }
        }
      }
      
      // Combine all conditions with AND
      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined;
      
      // Determine sort direction
      const sortDirection = order.toLowerCase() === 'asc' ? asc : desc;
      
      // Execute query with pagination
      const employeesQuery = db
        .select()
        .from(employees)
        .where(whereClause)
        .orderBy(sortDirection(employees[sort] || employees.id))
        .limit(limit)
        .offset(offset);
        
      // Get total count for pagination
      const countQuery = db
        .select({ count: sql`count(*)` })
        .from(employees)
        .where(whereClause);
      
      // Execute both queries
      const [employeesList, totalCount] = await Promise.all([
        employeesQuery,
        countQuery
      ]);
      
      const total = totalCount[0].count;
      
      // Enrich employee data with additional information if needed
      const enrichedEmployees = await Promise.all(
        employeesList.map(async (employee) => {
          // You could add joins with other tables here to fetch related data
          // Example: fetch department and designation
          return {
            ...employee,
            // Add custom fields or transformations here if needed
            fullName: `${employee.firstName} ${employee.lastName}`
          };
        })
      );
      
      return {
        data: enrichedEmployees,
        count: enrichedEmployees.length,
        total: total,
        page: page,
        pageCount: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error('EmployeeService GetEmployees:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get managers (employees with manager role)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated managers data
   */
  async getManagers(options) {
    try {
      // Set role filter to "Manager" and delegate to getEmployees
      return this.getEmployees({
        ...options,
        role: "Manager"
      });
    } catch (error) {
      logger.error('EmployeeService GetManagers:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get regular employees (with role "Employee")
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated employees data
   */
  async getRegularEmployees(options) {
    try {
      // Set role filter to "Employee" and delegate to getEmployees
      return this.getEmployees({
        ...options,
        role: "Employee"
      });
    } catch (error) {
      logger.error('EmployeeService GetRegularEmployees:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Get employee by ID or employee code
   * @param {string|number} idOrCode - Employee ID or employee code
   * @returns {Promise<Object>} Employee details
   */
  async getEmployeeById(idOrCode) {
    try {
      // Check if the provided ID is numeric (primary key) or string (empId)
      let query = db.select().from(employees);
      
      if (typeof idOrCode === 'number' || /^\d+$/.test(idOrCode)) {
        query = query.where(eq(employees.id, parseInt(idOrCode)));
      } else {
        query = query.where(eq(employees.empId, idOrCode));
      }

      const employee = await query.limit(1);

      if (!employee || employee.length === 0) {
        throw new Error("Employee not found");
      }

      // Fetch related information
      const [professionalDetails] = await db
        .select()
        .from(employeeProfessionalDetails)
        .where(eq(employeeProfessionalDetails.employeeId, employee[0].id))
        .limit(1);
      
      const [contactDetails] = await db
        .select()
        .from(employeeContacts)
        .where(eq(employeeContacts.employeeId, employee[0].id))
        .limit(1);
      
      // Fetch department and designation names if available
      let departmentName = null;
      let designationName = null;
      
      if (professionalDetails?.departmentId) {
        const [department] = await db
          .select()
          .from(departments)
          .where(eq(departments.id, professionalDetails.departmentId))
          .limit(1);
        
        departmentName = department?.name;
      }
      
      if (professionalDetails?.designationId) {
        const [designation] = await db
          .select()
          .from(designations)
          .where(eq(designations.id, professionalDetails.designationId))
          .limit(1);
        
        designationName = designation?.name;
      }
      
      // Combine all information
      return {
        ...employee[0],
        professionalDetails: professionalDetails ? {
          ...professionalDetails,
          departmentName,
          designationName
        } : null,
        contactDetails: contactDetails || null
      };
    } catch (error) {
      logger.error('EmployeeService GetEmployeeById:', {
        error: error.message,
        stack: error.stack,
        idOrCode
      });
      throw error;
    }
  }

  /**
   * Update employee details
   * @param {number} id - Employee ID
   * @param {Object} employeeData - Updated employee data
   * @returns {Promise<Object>} Updated employee
   */
  async updateEmployee(id, employeeData) {
    try {
      // Convert date strings to Date objects if present
      const processedData = {
        ...employeeData,
        dateOfBirth: employeeData.dateOfBirth ? new Date(employeeData.dateOfBirth) : undefined
      };

      await db
        .update(employees)
        .set(processedData)
        .where(eq(employees.id, id))
        .execute();

      const updatedEmployee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, id));

      if (!updatedEmployee || updatedEmployee.length === 0) {
        throw new Error("Employee not found after update");
      }

      logger.info(`Employee updated successfully: ${id}`);
      return updatedEmployee[0];
    } catch (error) {
      logger.error('EmployeeService UpdateEmployee:', {
        error: error.message,
        stack: error.stack,
        employeeId: id
      });
      throw error;
    }
  }

  /**
   * Delete an employee
   * @param {number} id - Employee ID
   * @returns {Promise<void>}
   */
  async deleteEmployee(id) {
    try {
      // You might want to implement a soft delete instead
      // or delete related records in other tables first
      const result = await db
        .delete(employees)
        .where(eq(employees.id, id))
        .execute();
      
      if (result.affectedRows === 0) {
        throw new Error("Employee not found or already deleted");
      }
      
      logger.info(`Employee deleted successfully: ${id}`);
    } catch (error) {
      logger.error('EmployeeService DeleteEmployee:', {
        error: error.message,
        stack: error.stack,
        employeeId: id
      });
      throw error;
    }
  }

  /**
   * Get employees by team ID
   * @param {number} teamId - Team ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated team members
   */
  async getEmployeesByTeam(teamId, options = {}) {
    try {
      const filter = { 
        ...options.filter,
        teamId: teamId 
      };
      
      return this.getEmployees({
        ...options,
        filter
      });
    } catch (error) {
      logger.error('EmployeeService GetEmployeesByTeam:', {
        error: error.message,
        stack: error.stack,
        teamId
      });
      throw error;
    }
  }

  /**
   * Get employee count statistics
   * @returns {Promise<Object>} Employee counts by role and department
   */
  async getEmployeeStats() {
    try {
      // Get total counts
      const [totalCount] = await db
        .select({ count: sql`count(*)` })
        .from(employees);
      
      // Get employee counts by joining with users to get roles
      const usersTable = await db
        .select({
          id: users.id,
          role: users.role
        })
        .from(users);
        
      const employeesTable = await db
        .select({
          id: employees.id,
          userId: employees.userId
        })
        .from(employees);
      
      // Count by role (with a join operation)
      const roleCountMap = {};
      
      employeesTable.forEach(emp => {
        const user = usersTable.find(u => u.id === emp.userId);
        if (user) {
          roleCountMap[user.role] = (roleCountMap[user.role] || 0) + 1;
        }
      });
      
      // Get department counts
      const professionalDetails = await db
        .select({
          employeeId: employeeProfessionalDetails.employeeId,
          departmentId: employeeProfessionalDetails.departmentId
        })
        .from(employeeProfessionalDetails);
      
      const departmentsTable = await db
        .select()
        .from(departments);
      
      // Count by department (with a join operation)
      const departmentCountMap = {};
      
      professionalDetails.forEach(detail => {
        if (detail.departmentId) {
          const dept = departmentsTable.find(d => d.id === detail.departmentId);
          if (dept) {
            departmentCountMap[dept.name] = (departmentCountMap[dept.name] || 0) + 1;
          }
        }
      });
      
      return {
        total: totalCount.count,
        byRole: roleCountMap,
        byDepartment: departmentCountMap
      };
    } catch (error) {
      logger.error('EmployeeService GetEmployeeStats:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
}

export const employeeService = new EmployeeService();