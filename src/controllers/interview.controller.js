import { db } from "../db/index.js";
import {
  interviews,
  interviewRounds,
  candidates,
  employees,
} from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { logger } from "../config/logger.js";

// Schedule interview
export const scheduleInterview = async (req, res) => {
  try {
    const interviewData = {
      ...req.body,
      scheduledDate: new Date(req.body.scheduledDate),
      joiningDate: req.body.joiningDate
        ? new Date(req.body.joiningDate)
        : undefined,
      status: "Scheduled",
    };

    // Insert interview
    const result = await db.insert(interviews).values(interviewData).execute();

    // Fetch the created interview
    const [newInterview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, result.insertId));

    logger.info("Interview scheduled successfully", {
      interviewId: result.insertId,
      candidateId: interviewData.candidateId,
    });

    res.json({
      success: true,
      data: newInterview,
    });
  } catch (error) {
    logger.error("Schedule interview error:", {
      error: error.message,
      stack: error.stack,
      interviewData: req.body,
    });
    res.status(500).json({
      success: false,
      message: "Failed to schedule interview",
    });
  }
};

// Add interview round
export const addInterviewRound = async (req, res) => {
  try {
    const roundData = {
      ...req.body,
      status: "Pending",
    };

    // Insert round
    const result = await db.insert(interviewRounds).values(roundData).execute();

    // Fetch the created round
    const [newRound] = await db
      .select()
      .from(interviewRounds)
      .where(eq(interviewRounds.id, result.insertId));

    logger.info("Interview round added successfully", {
      roundId: result.insertId,
      interviewId: roundData.interviewId,
    });

    res.json({
      success: true,
      data: newRound,
    });
  } catch (error) {
    logger.error("Add interview round error:", {
      error: error.message,
      stack: error.stack,
      roundData: req.body,
    });
    res.status(500).json({
      success: false,
      message: "Failed to add interview round",
    });
  }
};

// Update interview round status
export const updateRoundStatus = async (req, res) => {
  try {
    const { roundId } = req.params;
    const { status, remarks } = req.body;

    // Update round
    await db
      .update(interviewRounds)
      .set({ status, remarks })
      .where(eq(interviewRounds.id, roundId))
      .execute();

    // Fetch updated round
    const [updatedRound] = await db
      .select()
      .from(interviewRounds)
      .where(eq(interviewRounds.id, roundId));

    logger.info("Interview round status updated", {
      roundId,
      status,
    });

    res.json({
      success: true,
      data: updatedRound,
    });
  } catch (error) {
    logger.error("Update round status error:", {
      error: error.message,
      stack: error.stack,
      roundId: req.params.roundId,
      updateData: req.body,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update round status",
    });
  }
};

// Update interview status and final decision
export const updateInterviewStatus = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const updateData = {
      ...req.body,
      joiningDate: req.body.joiningDate
        ? new Date(req.body.joiningDate)
        : undefined,
    };

    // Update interview
    await db
      .update(interviews)
      .set(updateData)
      .where(eq(interviews.id, interviewId))
      .execute();

    // Fetch updated interview
    const [updatedInterview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, interviewId));

    logger.info("Interview status updated", {
      interviewId,
      status: updateData.status,
      finalDecision: updateData.finalDecision,
    });

    res.json({
      success: true,
      data: updatedInterview,
    });
  } catch (error) {
    logger.error("Update interview status error:", {
      error: error.message,
      stack: error.stack,
      interviewId: req.params.interviewId,
      updateData: req.body,
    });
    res.status(500).json({
      success: false,
      message: "Failed to update interview status",
    });
  }
};

// Get interview details
export const getInterviewDetails = async (req, res) => {
  try {
    const { interviewId } = req.params;

    // Fetch interview with rounds
    const [interview] = await db
      .select()
      .from(interviews)
      .where(eq(interviews.id, interviewId));

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview not found",
      });
    }

    const rounds = await db
      .select()
      .from(interviewRounds)
      .where(eq(interviewRounds.interviewId, interviewId));

    res.json({
      success: true,
      data: {
        ...interview,
        rounds,
      },
    });
  } catch (error) {
    logger.error("Get interview details error:", {
      error: error.message,
      stack: error.stack,
      interviewId: req.params.interviewId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to get interview details",
    });
  }
};

// Get candidate interviews
export const getCandidateInterviews = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidateInterviews = await db
      .select()
      .from(interviews)
      .where(eq(interviews.candidateId, candidateId));

    res.json({
      success: true,
      data: candidateInterviews,
    });
  } catch (error) {
    logger.error("Get candidate interviews error:", {
      error: error.message,
      stack: error.stack,
      candidateId: req.params.candidateId,
    });
    res.status(500).json({
      success: false,
      message: "Failed to get candidate interviews",
    });
  }
};
