import { db } from "../db/index.js";
import {
  candidates,
  candidateQualifications,
  candidateExperience,
  candidateReferences,
} from "../db/schema.js";
import { eq, sql } from "drizzle-orm";
import { logger } from "../config/logger.js";
import { redisService } from "./redis.service.js";
import jwt from "jsonwebtoken";
import { ROLE } from "../config/constant.js";

class CandidateService {
  // Calculate progress based on completed sections
  async calculateProgress(candidateId) {
    try {
      // Get candidate base info
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, candidateId))
        .limit(1);

      if (!candidate) {
        throw new Error("Candidate not found");
      }

      // Check each section's completion
      const [qualifications] = await db
        .select({ count: sql`count(*)` })
        .from(candidateQualifications)
        .where(eq(candidateQualifications.candidateId, candidateId));

      const [experience] = await db
        .select({ count: sql`count(*)` })
        .from(candidateExperience)
        .where(eq(candidateExperience.candidateId, candidateId));

      const [references] = await db
        .select({ count: sql`count(*)` })
        .from(candidateReferences)
        .where(eq(candidateReferences.candidateId, candidateId));

      // Calculate section completion
      const personalInfoComplete = this.isPersonalInfoComplete(candidate);
      const sections = {
        personalInfo: personalInfoComplete ? 25 : 0,
        qualifications: qualifications.count > 0 ? 25 : 0,
        experience: experience.count > 0 ? 25 : 0,
        references: references.count > 0 ? 25 : 0,
      };

      const totalProgress = Object.values(sections).reduce((a, b) => a + b, 0);

      return {
        sections,
        total: totalProgress,
        isComplete: totalProgress === 100,
      };
    } catch (error) {
      logger.error("Error calculating candidate progress:", error);
      throw error;
    }
  }

  // Check if all required personal info fields are filled
  isPersonalInfoComplete(candidate) {
    const requiredFields = [
      "firstName",
      "lastName",
      "phone",
      "dateOfBirth",
      "currentAddress",
      "postApplied",
    ];

    return requiredFields.every((field) => !!candidate[field]);
  }

  // Create or update candidate basic info
  async upsertCandidate(email, data) {
    try {
      const [existingCandidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.email, email))
        .limit(1);

      if (existingCandidate) {
        // Update existing candidate
        await db
          .update(candidates)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(candidates.email, email));

        return await this.getCandidateByEmail(email);
      } else {
        // Create new candidate
        const [newCandidateId] = await db
          .insert(candidates)
          .values({
            ...data,
            email,
            verified: true,
          })
          .$returningId({ id: candidates.id });

        return await this.getCandidateById(newCandidateId.id);
      }
    } catch (error) {
      logger.error("Error upserting candidate:", error);
      throw error;
    }
  }

  // Add or update qualifications
  async upsertQualification(candidateId, qualificationData) {
    try {
      const [existingQual] = await db
        .select()
        .from(candidateQualifications)
        .where(eq(candidateQualifications.candidateId, candidateId))
        .limit(1);

      if (existingQual) {
        await db
          .update(candidateQualifications)
          .set(qualificationData)
          .where(eq(candidateQualifications.id, existingQual.id));

        return await this.getQualifications(candidateId);
      } else {
        await db
          .insert(candidateQualifications)
          .values({ ...qualificationData, candidateId });

        return await this.getQualifications(candidateId);
      }
    } catch (error) {
      logger.error("Error upserting qualification:", error);
      throw error;
    }
  }

  // Add or update experience
  async upsertExperience(candidateId, experienceData) {
    try {
      const [existingExp] = await db
        .select()
        .from(candidateExperience)
        .where(eq(candidateExperience.candidateId, candidateId))
        .limit(1);

      if (existingExp) {
        await db
          .update(candidateExperience)
          .set(experienceData)
          .where(eq(candidateExperience.id, existingExp.id));

        return await this.getExperience(candidateId);
      } else {
        await db
          .insert(candidateExperience)
          .values({ ...experienceData, candidateId });

        return await this.getExperience(candidateId);
      }
    } catch (error) {
      logger.error("Error upserting experience:", error);
      throw error;
    }
  }

  // Get candidate by email
  async getCandidateByEmail(email) {
    try {
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.email, email))
        .limit(1);

      if (!candidate) {
        return null;
      }

      const progress = await this.calculateProgress(candidate.id);
      return { ...candidate, progress };
    } catch (error) {
      logger.error("Error getting candidate by email:", error);
      throw error;
    }
  }

  // Get candidate by ID with full profile
  async getCandidateProfile(candidateId) {
    try {
      const [candidate] = await db
        .select()
        .from(candidates)
        .where(eq(candidates.id, candidateId))
        .limit(1);

      if (!candidate) {
        throw new Error("Candidate not found");
      }

      const qualifications = await this.getQualifications(candidateId);
      const experience = await this.getExperience(candidateId);
      const references = await this.getReferences(candidateId);
      const progress = await this.calculateProgress(candidateId);

      return {
        ...candidate,
        qualifications,
        experience,
        references,
        progress,
      };
    } catch (error) {
      logger.error("Error getting candidate profile:", error);
      throw error;
    }
  }

  // Helper methods for getting related data
  async getQualifications(candidateId) {
    return await db
      .select()
      .from(candidateQualifications)
      .where(eq(candidateQualifications.candidateId, candidateId));
  }

  async getExperience(candidateId) {
    return await db
      .select()
      .from(candidateExperience)
      .where(eq(candidateExperience.candidateId, candidateId));
  }

  async getReferences(candidateId) {
    return await db
      .select()
      .from(candidateReferences)
      .where(eq(candidateReferences.candidateId, candidateId));
  }

  async getPersonalInformation(candidateId) {
    return await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);
  }

  async verifyCandidateEmail(email) {
    try {
      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP in Redis with email as key
      await redisService.setOTP(email, otp);

      // Generate a temporary token for this verification session
      const verificationToken = jwt.sign(
        { email, purpose: "verification" },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );

      // Send OTP via email
      // await emailService.sendOTP(email, otp);

      return verificationToken;
    } catch (error) {
      logger.error("Verification initiation failed:", error);
      throw new Error("Failed to initiate verification");
    }
  }

  async validateCandidateOTP(verificationToken, providedOTP) {
    try {
      // Verify and decode the verification token
      const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
      if (!decoded || !decoded.email) {
        throw new CustomError("Invalid verification token", 400);
      }

      const { email } = decoded;

      // Get stored OTP from Redis
      const storedOTP = await redisService.getOTP(email);
      if (!storedOTP) throw new CustomError("OTP expired", 401);

      // Verify OTP
      if (storedOTP !== providedOTP) {
        throw new CustomError("Invalid OTP", 400);
      }

      // Clear the used OTP
      await redisService.deleteOTP(email);

      // Generate access token for verified user
      const accessToken = jwt.sign(
        { email, verified: true, role: ROLE.CANDIDATE },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return accessToken;
    } catch (error) {
      logger.error("Error in validateCandidateOTP:", error);
      throw new CustomError(
        error.message || "Failed to verify OTP",
        error.status || 500
      );
    }
  }
}

export const candidateService = new CandidateService();
