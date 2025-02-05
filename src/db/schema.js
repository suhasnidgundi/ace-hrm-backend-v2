import {
  mysqlTable,
  varchar,
  int,
  datetime,
  text,
  json,
  timestamp,
  boolean,
  mysqlEnum,
  decimal,
} from "drizzle-orm/mysql-core";

// User Authentication Schema
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password: varchar("password", { length: 60 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("employee"), // HR, MANAGER, EMPLOYEE
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Session Management
export const sessions = mysqlTable("sessions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id")
    .notNull()
    .references(() => users.id),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employee Core Information
export const employees = mysqlTable("employees", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id), // Link to authentication
  empId: varchar("emp_id", { length: 20 }).unique().notNull(),
  salutation: mysqlEnum("salutation", ["Mr", "Ms", "Mrs", "Dr", "Prof"]),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  middleName: varchar("middle_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  dateOfBirth: datetime("date_of_birth").notNull(),
  gender: varchar("gender", { length: 10 }),
  maritalStatus: varchar("marital_status", { length: 20 }),
  spouseName: varchar("spouse_name", { length: 100 }),
  fathersName: varchar("fathers_name", { length: 100 }),
  mothersName: varchar("mothers_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Leave Management Schema
export const leaveApplications = mysqlTable("leave_applications", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employees.id),
  leaveType: varchar("leave_type", { length: 10 }).notNull(),
  startDate: datetime("start_date").notNull(),
  endDate: datetime("end_date").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  approverId: int("approver_id").references(() => employees.id),
  reason: text("reason"),
  balanceAfter: int("balance_after"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Audit Trail Schema
export const audit_logs = mysqlTable("audit_logs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE
  entity: varchar("entity", { length: 50 }).notNull(), // employees, leave_applications, etc.
  entityId: int("entity_id").notNull(),
  oldValues: json("old_values"),
  newValues: json("new_values"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Company Holidays
export const holidays = mysqlTable("holidays", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  date: datetime("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Leave Types
export const leave_types = mysqlTable("leave_types", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 50 }).notNull(), // PL, CL, SL, LWP
  description: text("description"),
  maxDays: int("max_days").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Leave Applications
export const leave_applications = mysqlTable("leave_applications", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employees.id),
  leaveTypeId: int("leave_type_id")
    .notNull()
    .references(() => leave_types.id),
  startDate: datetime("start_date").notNull(),
  endDate: datetime("end_date").notNull(),
  status: varchar("status", { length: 20 }).default("pending"), // Approved, Rejected, Pending
  approverId: int("approver_id").references(() => employees.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Leave Balances
export const employee_leave_balances = mysqlTable("employee_leave_balances", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").references(() => employees.id),
  leaveTypeId: int("leave_type_id").references(() => leave_types.id),
  balance: int("balance").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Employee Documents
export const employee_documents = mysqlTable("employee_documents", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").references(() => employees.id),
  documentType: varchar("document_type", { length: 50 }).notNull(), // Aadhar, PAN, etc.
  documentNumber: varchar("document_number", { length: 50 }).notNull(),
  filePath: varchar("file_path", { length: 255 }).notNull(), // Path to uploaded file
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Salary Structure
export const employee_salary = mysqlTable("employee_salary", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id")
    .notNull()
    .references(() => employees.id),
  basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
  hra: decimal("hra", { precision: 10, scale: 2 }),
  da: decimal("da", { precision: 10, scale: 2 }),
  allowances: json("allowances"),
  deductions: json("deductions"),
  netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
  effectiveFrom: datetime("effective_from").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Bank Information
export const employee_bank_details = mysqlTable("employee_bank_details", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").references(() => employees.id),
  bankName: varchar("bank_name", { length: 100 }).notNull(),
  accountNumber: varchar("account_number", { length: 20 }).notNull(),
  ifscCode: varchar("ifsc_code", { length: 20 }).notNull(),
  branchName: varchar("branch_name", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Departments
export const departments = mysqlTable("departments", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Job Designations
export const designations = mysqlTable("designations", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Job and Department Info
export const employee_professional_details = mysqlTable(
  "employee_professional_details",
  {
    id: int("id").primaryKey().autoincrement(),
    employeeId: int("employee_id").references(() => employees.id),
    designationId: int("designation_id").references(() => designations.id),
    departmentId: int("department_id").references(() => departments.id),
    grade: varchar("grade", { length: 10 }),
    branch: varchar("branch", { length: 50 }),
    division: varchar("division", { length: 50 }),
    dateOfJoining: datetime("date_of_joining").notNull(),
    dateOfLeaving: datetime("date_of_leaving"),
    reasonForLeaving: text("reason_for_leaving"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  }
);

// Contact Details
export const employee_contacts = mysqlTable("employee_contacts", {
  id: int("id").primaryKey().autoincrement(),
  employeeId: int("employee_id").references(() => employees.id),
  email: varchar("email", { length: 255 }).unique().notNull(),
  phone: varchar("phone", { length: 20 }),
  mobile: varchar("mobile", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 50 }),
  state: varchar("state", { length: 50 }),
  pincode: varchar("pincode", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

// Refresh Tokens
export const refreshTokens = mysqlTable("refresh_tokens", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").references(() => users.id),
  token: varchar("token", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teams Table
export const teams = mysqlTable("teams", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  managerId: int("manager_id"),
  parentTeamId: int("parent_team_id").references(() => teams.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
