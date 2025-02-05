import { relations } from "drizzle-orm/relations";
import { employees, employeeBankDetails, employeeContacts, employeeDocuments, employeeLeaveBalances, leaveTypes, departments, employeeProfessionalDetails, designations, employeeSalary, users, leaveApplications, refreshTokens, sessions, teams } from "./schema";

export const employeeBankDetailsRelations = relations(employeeBankDetails, ({one}) => ({
	employee: one(employees, {
		fields: [employeeBankDetails.employeeId],
		references: [employees.id]
	}),
}));

export const employeesRelations = relations(employees, ({one, many}) => ({
	employeeBankDetails: many(employeeBankDetails),
	employeeContacts: many(employeeContacts),
	employeeDocuments: many(employeeDocuments),
	employeeLeaveBalances: many(employeeLeaveBalances),
	employeeProfessionalDetails: many(employeeProfessionalDetails),
	employeeSalaries: many(employeeSalary),
	user: one(users, {
		fields: [employees.userId],
		references: [users.id]
	}),
	leaveApplications_approverId: many(leaveApplications, {
		relationName: "leaveApplications_approverId_employees_id"
	}),
	leaveApplications_employeeId: many(leaveApplications, {
		relationName: "leaveApplications_employeeId_employees_id"
	}),
}));

export const employeeContactsRelations = relations(employeeContacts, ({one}) => ({
	employee: one(employees, {
		fields: [employeeContacts.employeeId],
		references: [employees.id]
	}),
}));

export const employeeDocumentsRelations = relations(employeeDocuments, ({one}) => ({
	employee: one(employees, {
		fields: [employeeDocuments.employeeId],
		references: [employees.id]
	}),
}));

export const employeeLeaveBalancesRelations = relations(employeeLeaveBalances, ({one}) => ({
	employee: one(employees, {
		fields: [employeeLeaveBalances.employeeId],
		references: [employees.id]
	}),
	leaveType: one(leaveTypes, {
		fields: [employeeLeaveBalances.leaveTypeId],
		references: [leaveTypes.id]
	}),
}));

export const leaveTypesRelations = relations(leaveTypes, ({many}) => ({
	employeeLeaveBalances: many(employeeLeaveBalances),
	leaveApplications: many(leaveApplications),
}));

export const employeeProfessionalDetailsRelations = relations(employeeProfessionalDetails, ({one}) => ({
	department: one(departments, {
		fields: [employeeProfessionalDetails.departmentId],
		references: [departments.id]
	}),
	designation: one(designations, {
		fields: [employeeProfessionalDetails.designationId],
		references: [designations.id]
	}),
	employee: one(employees, {
		fields: [employeeProfessionalDetails.employeeId],
		references: [employees.id]
	}),
}));

export const departmentsRelations = relations(departments, ({many}) => ({
	employeeProfessionalDetails: many(employeeProfessionalDetails),
}));

export const designationsRelations = relations(designations, ({many}) => ({
	employeeProfessionalDetails: many(employeeProfessionalDetails),
}));

export const employeeSalaryRelations = relations(employeeSalary, ({one}) => ({
	employee: one(employees, {
		fields: [employeeSalary.employeeId],
		references: [employees.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	employees: many(employees),
	refreshTokens: many(refreshTokens),
	sessions: many(sessions),
}));

export const leaveApplicationsRelations = relations(leaveApplications, ({one}) => ({
	employee_approverId: one(employees, {
		fields: [leaveApplications.approverId],
		references: [employees.id],
		relationName: "leaveApplications_approverId_employees_id"
	}),
	employee_employeeId: one(employees, {
		fields: [leaveApplications.employeeId],
		references: [employees.id],
		relationName: "leaveApplications_employeeId_employees_id"
	}),
	leaveType: one(leaveTypes, {
		fields: [leaveApplications.leaveTypeId],
		references: [leaveTypes.id]
	}),
}));

export const refreshTokensRelations = relations(refreshTokens, ({one}) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const teamsRelations = relations(teams, ({one, many}) => ({
	team: one(teams, {
		fields: [teams.parentTeamId],
		references: [teams.id],
		relationName: "teams_parentTeamId_teams_id"
	}),
	teams: many(teams, {
		relationName: "teams_parentTeamId_teams_id"
	}),
}));