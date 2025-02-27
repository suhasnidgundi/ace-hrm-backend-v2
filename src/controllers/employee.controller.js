import { employeeService } from "../services/employee.service.js";
import { logger } from "../config/logger.js";

export const createEmployee = async (req, res) => {
  try {
    // Convert date strings to Date objects
    const employeeData = {
      ...req.body,
      dateOfBirth: new Date(req.body.dateOfBirth)
    };

    const employee = await employeeService.createEmployee(employeeData);

    logger.info(`Employee created successfully with ID: ${employee.id}`);
    res.status(201).json(employee);
  } catch (error) {
    logger.error('Employee Controller CreateEmployee:', {
      error: error.message,
      stack: error.stack
    });
    res.status(400).json({ error: error.message });
  }
};

export const getEmployees = async (req, res) => {
  try {
    // Parse filter params - assuming filter comes as a JSON string in 's' parameter
    // Similar to the format shown in your example
    let filter = {};
    if (req.query.s) {
      try {
        const searchParam = JSON.parse(req.query.s);

        // Handle complex filters like {"$and":[{"role":{"$eq":"Employee"}}]}
        if (searchParam.$and) {
          searchParam.$and.forEach(condition => {
            Object.entries(condition).forEach(([key, value]) => {
              if (typeof value === 'object' && value.$eq) {
                filter[key] = value.$eq;
              } else {
                filter[key] = value;
              }
            });
          });
        }
      } catch (e) {
        logger.warn('Failed to parse search filter', { error: e.message });
      }
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';

    // Check if request is specifically for managers
    const role = filter.role || null;

    // Get employees based on role filter
    let result;
    if (role === 'Manager') {
      result = await employeeService.getManagers({
        page, limit, search, sort, order, filter
      });
    } else if (role === 'Employee') {
      result = await employeeService.getRegularEmployees({
        page, limit, search, sort, order, filter
      });
    } else {
      result = await employeeService.getEmployees({
        page, limit, search, sort, order, filter
      });
    }

    res.json(result);
  } catch (error) {
    logger.error('Employee Controller GetEmployees:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
};

export const getEmployee = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.json(employee);
  } catch (error) {
    logger.error('Employee Controller GetEmployee:', {
      error: error.message,
      stack: error.stack
    });
    res.status(404).json({ error: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(employee);
  } catch (error) {
    logger.error('Employee Controller GetEmployeeById:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const updatedEmployee = await employeeService.updateEmployee(
      req.params.id,
      req.body
    );

    logger.info(`Employee updated successfully: ${req.params.id}`);
    res.json(updatedEmployee);
  } catch (error) {
    logger.error('Employee Controller UpdateEmployee:', {
      error: error.message,
      stack: error.stack
    });
    res.status(400).json({ error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    await employeeService.deleteEmployee(req.params.id);
    res.status(204).end();
  } catch (error) {
    logger.error('Employee Controller DeleteEmployee:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeStats = async (req, res) => {
  try {
    const stats = await employeeService.getEmployeeStats();
    res.json(stats);
  } catch (error) {
    logger.error('Employee Controller GetEmployeeStats:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeesByTeam = async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await employeeService.getEmployeesByTeam(teamId, {
      page,
      limit
    });

    res.json(result);
  } catch (error) {
    logger.error('Employee Controller GetEmployeesByTeam:', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
};