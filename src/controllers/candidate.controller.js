import { db } from "../db/index.js";
import {
  candidates,
  candidateQualifications,
  candidateExperience,
  candidateReferences,
} from "../db/schema.js";
import { eq } from "drizzle-orm";

// Verify candidate by email
export const verifyCandidate = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if candidate exists
    const [existingCandidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.email, email))
      .limit(1);

    if (!existingCandidate) {
      return res.json({
        success: true,
        isNewCandidate: true,
        data: null,
      });
    }

    // Get candidate's progress
    const [qualifications] = await db
      .select({ count: sql`count(*)` })
      .from(candidateQualifications)
      .where(eq(candidateQualifications.candidateId, existingCandidate.id));

    const [experience] = await db
      .select({ count: sql`count(*)` })
      .from(candidateExperience)
      .where(eq(candidateExperience.candidateId, existingCandidate.id));

    const [references] = await db
      .select({ count: sql`count(*)` })
      .from(candidateReferences)
      .where(eq(candidateReferences.candidateId, existingCandidate.id));

    // Calculate completion percentage
    const progress = {
      personalInfo: existingCandidate ? 25 : 0,
      qualifications: qualifications.count > 0 ? 25 : 0,
      experience: experience.count > 0 ? 25 : 0,
      references: references.count > 0 ? 25 : 0,
    };

    const completionPercentage = Object.values(progress).reduce(
      (a, b) => a + b,
      0
    );

    res.json({
      success: true,
      isNewCandidate: false,
      data: {
        candidate: existingCandidate,
        progress: {
          ...progress,
          total: completionPercentage,
        },
      },
    });
  } catch (error) {
    console.error("Verify candidate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify candidate",
    });
  }
};

// Get candidate progress
export const getCandidateProgress = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const [candidate] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    // Get completion status for each section
    const [qualifications] = await db
      .select()
      .from(candidateQualifications)
      .where(eq(candidateQualifications.candidateId, candidateId));

    const [experience] = await db
      .select()
      .from(candidateExperience)
      .where(eq(candidateExperience.candidateId, candidateId));

    const [references] = await db
      .select()
      .from(candidateReferences)
      .where(eq(candidateReferences.candidateId, candidateId));

    res.json({
      success: true,
      data: {
        personalInfo: {
          completed: true,
          data: candidate,
        },
        qualifications: {
          completed: !!qualifications,
          data: qualifications || null,
        },
        experience: {
          completed: !!experience,
          data: experience || null,
        },
        references: {
          completed: !!references,
          data: references || null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get candidate progress",
    });
  }
};

// Register new candidate
export const registerCandidate = async (req, res) => {
  try {
    const candidateData = req.body;
    
    const [newCandidate] = await db
      .insert(candidates)
      .values(candidateData)
      .returning();

    res.json({
      success: true,
      data: newCandidate,
    });
  } catch (error) {
    console.error("Register candidate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register candidate",
    });
  }
};

// Update candidate information
export const updateCandidateInfo = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const updateData = req.body;

    const [updatedCandidate] = await db
      .update(candidates)
      .set(updateData)
      .where(eq(candidates.id, candidateId))
      .returning();

    if (!updatedCandidate) {
      return res.status(404).json({
        success: false,
        message: "Candidate not found",
      });
    }

    res.json({
      success: true,
      data: updatedCandidate,
    });
  } catch (error) {
    console.error("Update candidate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update candidate information",
    });
  }
};

// Add qualification
export const addQualification = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const qualificationData = { ...req.body, candidateId };

    const [newQualification] = await db
      .insert(candidateQualifications)
      .values(qualificationData)
      .returning();

    res.json({
      success: true,
      data: newQualification,
    });
  } catch (error) {
    console.error("Add qualification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add qualification",
    });
  }
};

// Get qualifications
export const getQualifications = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const qualifications = await db
      .select()
      .from(candidateQualifications)
      .where(eq(candidateQualifications.candidateId, candidateId));

    res.json({
      success: true,
      data: qualifications,
    });
  } catch (error) {
    console.error("Get qualifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get qualifications",
    });
  }
};

// Add experience
export const addExperience = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const experienceData = { ...req.body, candidateId };

    const [newExperience] = await db
      .insert(candidateExperience)
      .values(experienceData)
      .returning();

    res.json({
      success: true,
      data: newExperience,
    });
  } catch (error) {
    console.error("Add experience error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add experience",
    });
  }
};

// Get experience
export const getExperience = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const experience = await db
      .select()
      .from(candidateExperience)
      .where(eq(candidateExperience.candidateId, candidateId));

    res.json({
      success: true,
      data: experience,
    });
  } catch (error) {
    console.error("Get experience error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get experience",
    });
  }
};

// Add reference
export const addReference = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const referenceData = { ...req.body, candidateId };

    const [newReference] = await db
      .insert(candidateReferences)
      .values(referenceData)
      .returning();

    res.json({
      success: true,
      data: newReference,
    });
  } catch (error) {
    console.error("Add reference error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add reference",
    });
  }
};

// Get references
export const getReferences = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const references = await db
      .select()
      .from(candidateReferences)
      .where(eq(candidateReferences.candidateId, candidateId));

    res.json({
      success: true,
      data: references,
    });
  } catch (error) {
    console.error("Get references error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get references",
    });
  }
};