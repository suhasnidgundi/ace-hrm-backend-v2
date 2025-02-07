import { SALT_ROUNDS } from "../controllers/auth.controller.js";
import { db } from "./index.js";
import {
  users,
  employees,
  leave_types,
  employee_leave_balances,
  departments,
  designations,
  candidates,
  candidateQualifications,
  candidateExperience,
  candidateReferences,
  interviews,
  interviewRounds,
  employee_professional_details,
  employee_contacts,
  employee_bank_details,
  employee_salary,
} from "./schema.js";
import bcrypt from "bcrypt";

async function seed() {
  try {
    // Insert departments
    const departmentData = [
      { name: "Cardiology", description: "Heart and cardiovascular care" },
      { name: "Neurology", description: "Brain and nervous system" },
      { name: "Orthopedics", description: "Bones and joints" },
      { name: "HR", description: "Human Resources" },
      { name: "Administration", description: "Hospital Administration" },
      { name: "Emergency", description: "Emergency care" },
      { name: "Pediatrics", description: "Child healthcare" },
      { name: "Oncology", description: "Cancer treatment" },
    ];
    
    await db.insert(departments).values(departmentData);
    const insertedDepts = await db.select().from(departments);

    // Insert designations
    const designationData = [
      { name: "Chief Medical Officer", description: "Head of medical staff" },
      { name: "Senior Consultant", description: "Senior specialist doctor" },
      { name: "Junior Consultant", description: "Junior specialist doctor" },
      { name: "HR Manager", description: "Human resources manager" },
      { name: "Staff Nurse", description: "Nursing staff" },
      { name: "Administrator", description: "Administrative staff" },
      { name: "Resident Doctor", description: "Resident medical staff" },
      { name: "Department Head", description: "Head of department" },
    ];
    
    await db.insert(designations).values(designationData);
    const insertedDesignations = await db.select().from(designations);

    // Insert users with different roles
    const userData = [
      {
        email: "hr@acehospital.in",
        password: await bcrypt.hash("HR@123", SALT_ROUNDS),
        role: "HR",
      },
      {
        email: "cmo@acehospital.in",
        password: await bcrypt.hash("CMO@123", SALT_ROUNDS),
        role: "DOCTOR",
      },
      {
        email: "cardio@acehospital.in",
        password: await bcrypt.hash("Doctor@123", SALT_ROUNDS),
        role: "DOCTOR",
      },
      {
        email: "neuro@acehospital.in",
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
    ];

    await db.insert(users).values(userData);
    const insertedUsers = await db.select().from(users);

    // Insert employees with more detailed information
    const employeeData = insertedUsers.map((user, index) => ({
      userId: user.id,
      empId: `ACE-${String(index + 1).padStart(3, '0')}`,
      salutation: index < 4 ? "Dr" : "Mr",
      firstName: ["Sarah", "James", "Emily", "Michael", "Lisa", "David"][index],
      lastName: ["Johnson", "Smith", "Brown", "Davis", "Wilson", "Taylor"][index],
      dateOfBirth: new Date(1980 + index, index, 1),
      gender: index % 2 === 0 ? "Female" : "Male",
      maritalStatus: index % 2 === 0 ? "Married" : "Single",
    }));

    await db.insert(employees).values(employeeData);
    const insertedEmployees = await db.select().from(employees);

    // Insert professional details for employees
    const professionalDetails = insertedEmployees.map(emp => ({
      employeeId: emp.id,
      designationId: insertedDesignations[emp.id % insertedDesignations.length].id,
      departmentId: insertedDepts[emp.id % insertedDepts.length].id,
      dateOfJoining: new Date(2024, 0, 1),
      grade: ["A", "B", "C"][Math.floor(Math.random() * 3)],
      branch: "Main Branch",
      division: ["Medical", "Administrative", "Support"][Math.floor(Math.random() * 3)],
    }));

    await db.insert(employee_professional_details).values(professionalDetails);

    // Insert employee contact details
    const contactDetails = insertedEmployees.map(emp => ({
      employeeId: emp.id,
      email: `${emp.firstName.toLowerCase()}@acehospital.in`,
      phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      mobile: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      address: "123 Hospital Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
    }));

    await db.insert(employee_contacts).values(contactDetails);

    // Insert employee bank details
    const bankDetails = insertedEmployees.map(emp => ({
      employeeId: emp.id,
      bankName: ["HDFC", "ICICI", "SBI"][Math.floor(Math.random() * 3)],
      accountNumber: `${Math.floor(Math.random() * 1000000000000)}`,
      ifscCode: "BANK0123456",
      branchName: "Main Branch",
    }));

    await db.insert(employee_bank_details).values(bankDetails);

    // Insert employee salary details
    const salaryDetails = insertedEmployees.map(emp => ({
      employeeId: emp.id,
      basicSalary: 50000 + Math.floor(Math.random() * 50000),
      hra: 20000 + Math.floor(Math.random() * 10000),
      da: 10000 + Math.floor(Math.random() * 5000),
      allowances: JSON.stringify({
        transport: 5000,
        medical: 3000,
        special: 2000
      }),
      deductions: JSON.stringify({
        pf: 1800,
        tax: 5000,
        insurance: 2000
      }),
      netSalary: 85000 + Math.floor(Math.random() * 15000),
      effectiveFrom: new Date(2024, 0, 1),
    }));

    await db.insert(employee_salary).values(salaryDetails);

    // Insert leave types
    const leaveTypes = [
      { name: "PL", description: "Privilege Leave", maxDays: 18 },
      { name: "CL", description: "Casual Leave", maxDays: 12 },
      { name: "SL", description: "Sick Leave", maxDays: 12 },
      { name: "ML", description: "Maternity Leave", maxDays: 180 },
      { name: "PL", description: "Paternity Leave", maxDays: 15 },
      { name: "LWP", description: "Leave Without Pay", maxDays: 0 },
    ];

    await db.insert(leave_types).values(leaveTypes);
    const insertedLeaveTypes = await db.select().from(leave_types);

    // Insert sample candidates
    const candidateData = [
      {
        salutation: "Dr",
        firstName: "John",
        lastName: "Wilson",
        email: "john.wilson@example.com",
        phone: "9876543210",
        dateOfBirth: new Date(1992, 5, 15),
        postApplied: "Senior Cardiologist",
        currentAddress: "456 Medical Avenue",
      },
      {
        salutation: "Dr",
        firstName: "Emma",
        lastName: "Thompson",
        email: "emma.t@example.com",
        phone: "9876543211",
        dateOfBirth: new Date(1990, 8, 20),
        postApplied: "Neurologist",
        currentAddress: "789 Doctor Lane",
      },
    ];

    await db.insert(candidates).values(candidateData);
    const insertedCandidates = await db.select().from(candidates);

    // Insert candidate qualifications
    const qualifications = insertedCandidates.map(candidate => ({
      candidateId: candidate.id,
      degree: "MBBS",
      yearOfPassing: "2015",
      boardUniversity: "Medical University",
      marksObtained: "75%",
    }));

    await db.insert(candidateQualifications).values(qualifications);

    // Insert candidate experience
    const experience = insertedCandidates.map(candidate => ({
      candidateId: candidate.id,
      organizationName: "City Hospital",
      designation: "Junior Doctor",
      period: "2015-2020",
      ctc: 1200000,
      workLocation: "Mumbai",
    }));

    await db.insert(candidateExperience).values(experience);

    // Insert candidate references
    const references = insertedCandidates.map(candidate => ({
      candidateId: candidate.id,
      name: "Dr. Senior Doctor",
      designation: "HOD",
      company: "City Hospital",
      contactNumber: "9876543212",
    }));

    await db.insert(candidateReferences).values(references);

    // Schedule interviews for candidates
    const interviewData = insertedCandidates.map(candidate => ({
      candidateId: candidate.id,
      scheduledDate: new Date(2025, 2, 15),
      status: "Scheduled",
      departmentId: insertedDepts[0].id,
      reportingTo: "Dr. Department Head",
    }));

    await db.insert(interviews).values(interviewData);
    const insertedInterviews = await db.select().from(interviews);

    // Create interview rounds - Fixed to use correct enum values
    const interviewRoundData = insertedInterviews.flatMap(interview => ([
      {
        interviewId: interview.id,
        roundType: "IT", // Changed from 'Technical' to 'IT' to match enum
        interviewerId: insertedEmployees[0].id,
        status: "Pending",
      },
      {
        interviewId: interview.id,
        roundType: "HR", // This matches the enum
        interviewerId: insertedEmployees[1].id,
        status: "Pending",
      },
      {
        interviewId: interview.id,
        roundType: "HOD", // Added HOD round
        interviewerId: insertedEmployees[2].id,
        status: "Pending",
      }
    ]));

    await db.insert(interviewRounds).values(interviewRoundData);

    // Insert employee leave balances
    const leaveBalances = insertedEmployees.flatMap(emp => 
      insertedLeaveTypes.slice(0, 3).map(leaveType => ({
        employeeId: emp.id,
        leaveTypeId: leaveType.id,
        balance: Math.floor(Math.random() * leaveType.maxDays),
      }))
    );

    await db.insert(employee_leave_balances).values(leaveBalances);

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
    throw error;
  }
}

// Execute the seed function
seed().catch(console.error);