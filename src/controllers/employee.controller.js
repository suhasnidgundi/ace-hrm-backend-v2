import { employees } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import db from "../db/index.js";

export const createEmployee = async (req, res) => {
  try {
    const [employee] = await db.insert(employees).values(req.body).returning();
    res.status(201).json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add pagination
export const getEmployees = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const employeesQuery = db
      .select()
      .from(employees)
      .limit(limit)
      .offset(offset);
    const countQuery = db.select({ count: sql`count(*)` }).from(employees);

    const [employeesList, total] = await Promise.all([
      employeesQuery,
      countQuery,
    ]);

    res.json({
      data: employeesList,
      pagination: {
        current: page,
        total: Math.ceil(total[0].count / limit),
      },
    });
  } catch (error) {
    console.log("Employee Controller GetEmployees : ", error);
    res.status(500).json({ error: error.message });
  }
};

export const getEmployee = async (req, res) => {
  try {
    const employee = await db
      .select()
      .from(employees)
      .where(eq("id", req.params.id))
      .single();
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const [employee] = await db
      .update(employees)
      .set(req.body)
      .where(eq("id", req.params.id))
      .returning();
    res.json(employee);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    await db.delete(employees).where(eq("id", req.params.id)).execute();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const paramId = req.params.id;
    let query = db.select().from(employees);

    // Check if the id is numeric (primary key) or string (empId)
    if (/^\d+$/.test(paramId)) {
      query = query.where(eq(employees.id, parseInt(paramId)));
    } else {
      query = query.where(eq(employees.empId, paramId));
    }

    const employee = await query.limit(1);

    if (!employee || employee.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(employee[0]);
  } catch (error) {
    console.log("Employee Controller GetEmployeeById : ", error);
    res.status(500).json({ error: error.message });
  }
};
