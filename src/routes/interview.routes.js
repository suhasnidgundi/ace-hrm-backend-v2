import { Router } from "express";
import {
  scheduleInterview,
  addInterviewRound,
  updateRoundStatus,
  updateInterviewStatus,
  getInterviewDetails,
  getCandidateInterviews,
} from "../controllers/interview.controller.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Interview management routes
router.post("/schedule", scheduleInterview);
router.get("/:interviewId", getInterviewDetails);
router.patch("/:interviewId/status", updateInterviewStatus);

// Interview rounds routes
router.post("/rounds", addInterviewRound);
router.patch("/rounds/:roundId/status", updateRoundStatus);

// Candidate interview history
router.get("/candidate/:candidateId", getCandidateInterviews);

export default router;
