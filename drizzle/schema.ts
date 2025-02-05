import { mysqlTable, mysqlSchema, AnyMySqlColumn, primaryKey, int, varchar, json, timestamp, text, foreignKey, unique, datetime, decimal, mysqlEnum } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const auditLogs = mysqlTable("audit_logs", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull(),
	action: varchar({ length: 50 }).notNull(),
	entity: varchar({ length: 50 }).notNull(),
	entityId: int("entity_id").notNull(),
	oldValues: json("old_values"),
	newValues: json("new_values"),
	timestamp: timestamp({ mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "audit_logs_id"}),
]);

export const departments = mysqlTable("departments", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "departments_id"}),
]);

export const designations = mysqlTable("designations", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "designations_id"}),
]);

export const employeeBankDetails = mysqlTable("employee_bank_details", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").references(() => employees.id),
	bankName: varchar("bank_name", { length: 100 }).notNull(),
	accountNumber: varchar("account_number", { length: 20 }).notNull(),
	ifscCode: varchar("ifsc_code", { length: 20 }).notNull(),
	branchName: varchar("branch_name", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employee_bank_details_id"}),
]);

export const employeeContacts = mysqlTable("employee_contacts", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").references(() => employees.id),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	mobile: varchar({ length: 20 }),
	address: text(),
	city: varchar({ length: 50 }),
	state: varchar({ length: 50 }),
	pincode: varchar({ length: 10 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employee_contacts_id"}),
	unique("employee_contacts_email_unique").on(table.email),
]);

export const employeeDocuments = mysqlTable("employee_documents", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").references(() => employees.id),
	documentType: varchar("document_type", { length: 50 }).notNull(),
	documentNumber: varchar("document_number", { length: 50 }).notNull(),
	filePath: varchar("file_path", { length: 255 }).notNull(),
	verified: tinyint().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employee_documents_id"}),
]);

export const employeeLeaveBalances = mysqlTable("employee_leave_balances", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").references(() => employees.id),
	leaveTypeId: int("leave_type_id").references(() => leaveTypes.id),
	balance: int().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employee_leave_balances_id"}),
]);

export const employeeProfessionalDetails = mysqlTable("employee_professional_details", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").references(() => employees.id),
	designationId: int("designation_id").references(() => designations.id),
	departmentId: int("department_id").references(() => departments.id),
	grade: varchar({ length: 10 }),
	branch: varchar({ length: 50 }),
	division: varchar({ length: 50 }),
	dateOfJoining: datetime("date_of_joining", { mode: 'string'}).notNull(),
	dateOfLeaving: datetime("date_of_leaving", { mode: 'string'}),
	reasonForLeaving: text("reason_for_leaving"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employee_professional_details_id"}),
]);

export const employeeSalary = mysqlTable("employee_salary", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id),
	basicSalary: decimal("basic_salary", { precision: 10, scale: 2 }).notNull(),
	hra: decimal({ precision: 10, scale: 2 }),
	da: decimal({ precision: 10, scale: 2 }),
	allowances: json(),
	deductions: json(),
	netSalary: decimal("net_salary", { precision: 10, scale: 2 }).notNull(),
	effectiveFrom: datetime("effective_from", { mode: 'string'}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employee_salary_id"}),
]);

export const employees = mysqlTable("employees", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").references(() => users.id),
	empId: varchar("emp_id", { length: 20 }).notNull(),
	firstName: varchar("first_name", { length: 50 }).notNull(),
	lastName: varchar("last_name", { length: 50 }).notNull(),
	dateOfBirth: datetime("date_of_birth", { mode: 'string'}).notNull(),
	gender: varchar({ length: 10 }),
	maritalStatus: varchar("marital_status", { length: 20 }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	salutation: mysqlEnum(['Mr','Ms','Mrs','Dr','Prof']),
	middleName: varchar("middle_name", { length: 50 }),
	spouseName: varchar("spouse_name", { length: 100 }),
	fathersName: varchar("fathers_name", { length: 100 }),
	mothersName: varchar("mothers_name", { length: 100 }),
},
(table) => [
	primaryKey({ columns: [table.id], name: "employees_id"}),
	unique("employees_emp_id_unique").on(table.empId),
]);

export const holidays = mysqlTable("holidays", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	date: datetime({ mode: 'string'}).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "holidays_id"}),
]);

export const leaveApplications = mysqlTable("leave_applications", {
	id: int().autoincrement().notNull(),
	employeeId: int("employee_id").notNull().references(() => employees.id),
	startDate: datetime("start_date", { mode: 'string'}).notNull(),
	endDate: datetime("end_date", { mode: 'string'}).notNull(),
	status: varchar({ length: 20 }).default('pending'),
	approverId: int("approver_id").references(() => employees.id),
	reason: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
	leaveTypeId: int("leave_type_id").notNull().references(() => leaveTypes.id),
},
(table) => [
	primaryKey({ columns: [table.id], name: "leave_applications_id"}),
]);

export const leaveTypes = mysqlTable("leave_types", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 50 }).notNull(),
	description: text(),
	maxDays: int("max_days").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "leave_types_id"}),
]);

export const refreshTokens = mysqlTable("refresh_tokens", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").references(() => users.id),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "refresh_tokens_id"}),
]);

export const sessions = mysqlTable("sessions", {
	id: int().autoincrement().notNull(),
	userId: int("user_id").notNull().references(() => users.id),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
},
(table) => [
	primaryKey({ columns: [table.id], name: "sessions_id"}),
]);

export const teams = mysqlTable("teams", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	managerId: int("manager_id"),
	parentTeamId: int("parent_team_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	foreignKey({
			columns: [table.parentTeamId],
			foreignColumns: [table.id],
			name: "teams_parent_team_id_teams_id_fk"
		}),
	primaryKey({ columns: [table.id], name: "teams_id"}),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 20 }).default('employee').notNull(),
	isActive: tinyint("is_active").default(1),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`(now())`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`(now())`).onUpdateNow(),
},
(table) => [
	primaryKey({ columns: [table.id], name: "users_id"}),
	unique("users_email_unique").on(table.email),
]);
