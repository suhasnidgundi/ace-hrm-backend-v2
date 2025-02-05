import { SALT_ROUNDS } from "../controllers/auth.controller.js";
import { db } from "./index.js";
import {
  users,
  employees,
  leave_types,
  employee_leave_balances,
  leave_applications,
  departments,
  designations,
} from "./schema.js";
import bcrypt from "bcrypt";

// Insert sample users
await db.insert(users).values([
  {
    email: "hr@acehospital.in",
    password: await bcrypt.hash("HR@123", SALT_ROUNDS),
    role: "HR",
  },
  {
    email: "doctor1@acehospital.in",
    password: await bcrypt.hash("Doctor@123", SALT_ROUNDS),
    role: "DOCTOR",
  },
  {
    email: "doctor2@acehospital.in",
    password: await bcrypt.hash("Doctor@123", SALT_ROUNDS),
    role: "DOCTOR",
  },
  {
    email: "nurse1@acehospital.in",
    password: await bcrypt.hash("Nurse@123", SALT_ROUNDS),
    role: "NURSE",
  },
  {
    email: "admin@acehospital.in",
    password: await bcrypt.hash("Admin@123", SALT_ROUNDS),
    role: "ADMIN",
  },
]);

// Insert sample employees
await db.insert(employees).values([
  {
    userId: 1,
    empId: "ACE-001",
    salutation: "Dr",
    firstName: "John",
    lastName: "Doe",
    dateOfBirth: new Date("1980-01-01"),
    gender: "Male",
    departmentId: 1,
    designationId: 1,
  },
  {
    userId: 2,
    empId: "ACE-002",
    salutation: "Dr",
    firstName: "Jane",
    lastName: "Smith",
    dateOfBirth: new Date("1985-06-15"),
    gender: "Female",
    departmentId: 1,
    designationId: 2,
  },
  {
    userId: 3,
    empId: "ACE-003",
    salutation: "Dr",
    firstName: "David",
    lastName: "Brown",
    dateOfBirth: new Date("1990-09-10"),
    gender: "Male",
    departmentId: 2,
    designationId: 2,
  },
  {
    userId: 4,
    empId: "ACE-004",
    salutation: "Mr",
    firstName: "Emily",
    lastName: "Clark",
    dateOfBirth: new Date("1992-04-20"),
    gender: "Female",
    departmentId: 3,
    designationId: 4,
  },
  {
    userId: 5,
    empId: "ACE-005",
    salutation: "Ms",
    firstName: "Michael",
    lastName: "Johnson",
    dateOfBirth: new Date("1988-11-30"),
    gender: "Male",
    departmentId: 4,
    designationId: 5,
  },
]);

// Insert leave types
await db.insert(leave_types).values([
  { name: "PL", maxDays: 18 },
  { name: "CL", maxDays: 12 },
  { name: "SL", maxDays: 12 },
  { name: "LWP", maxDays: 0 },
]);

// Insert departments
await db
  .insert(departments)
  .values([
    { name: "Cardiology" },
    { name: "Neurology" },
    { name: "Orthopedics" },
    { name: "HR" },
    { name: "Administration" },
  ]);

// Insert designations
await db
  .insert(designations)
  .values([
    { name: "Senior Doctor" },
    { name: "Junior Doctor" },
    { name: "HR Manager" },
    { name: "Staff Nurse" },
    { name: "Administrator" },
  ]);

// Insert employee leave balances
await db.insert(employee_leave_balances).values([
  { employeeId: 1, leaveTypeId: 1, balance: 15 },
  { employeeId: 1, leaveTypeId: 2, balance: 10 },
  { employeeId: 2, leaveTypeId: 1, balance: 18 },
  { employeeId: 3, leaveTypeId: 3, balance: 8 },
  { employeeId: 4, leaveTypeId: 2, balance: 12 },
  { employeeId: 5, leaveTypeId: 4, balance: 0 },
]);

// Insert sample leave applications
await db.insert(leave_applications).values([
  {
    employeeId: 1,
    leaveTypeId: 1,
    startDate: new Date("2025-02-10"),
    endDate: new Date("2025-02-12"),
    status: "Approved",
  },
  {
    employeeId: 2,
    leaveTypeId: 2,
    startDate: new Date("2025-03-05"),
    endDate: new Date("2025-03-07"),
    status: "Pending",
  },
  {
    employeeId: 3,
    leaveTypeId: 3,
    startDate: new Date("2025-04-01"),
    endDate: new Date("2025-04-02"),
    status: "Rejected",
  },
  {
    employeeId: 4,
    leaveTypeId: 2,
    startDate: new Date("2025-05-15"),
    endDate: new Date("2025-05-18"),
    status: "Approved",
  },
  {
    employeeId: 5,
    leaveTypeId: 4,
    startDate: new Date("2025-06-10"),
    endDate: new Date("2025-06-11"),
    status: "Pending",
  },
]);

console.log("Database seeding completed!");
