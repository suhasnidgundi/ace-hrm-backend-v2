import { db } from "../db/index.js";
import { users, employees, employeeProfessionalDetails, employeeContacts, teams } from "../db/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SALT_ROUNDS } from "../controllers/auth.controller.js";

class AuthService {
  async validateToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  async getUserById(userId) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user;
  }

  async getEmployeeByUserId(userId) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, userId))
      .limit(1);
    
    return employee;
  }

  async getEmployeeDetails(employeeId) {
    const [professionalDetails] = await db
      .select()
      .from(employeeProfessionalDetails)
      .where(eq(employeeProfessionalDetails.employeeId, employeeId))
      .limit(1);
    
    const [contactDetails] = await db
      .select()
      .from(employeeContacts)
      .where(eq(employeeContacts.employeeId, employeeId))
      .limit(1);
    
    return {
      professionalDetails,
      contactDetails
    };
  }

  generateToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );
  }

  async hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  async comparePasswords(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

export const authService = new AuthService();