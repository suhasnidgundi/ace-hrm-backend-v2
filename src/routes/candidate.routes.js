import { Router } from "express";
import {
  verifyCandidate,
  getCandidateProgress,
  registerCandidate,
  updateCandidateInfo,
  addQualification,
  addExperience,
  addReference,
  getQualifications,
  getExperience,
  getReferences,
} from "../controllers/candidate.controller.js";

const router = Router();

// Candidate verification and progress
router.post("/verify", verifyCandidate);
router.get("/:candidateId/progress", getCandidateProgress);

// Personal information
router.post("/register", registerCandidate);
router.patch("/:candidateId", updateCandidateInfo);

// Qualifications
router.post("/:candidateId/qualifications", addQualification);
router.get("/:candidateId/qualifications", getQualifications);

// Experience
router.post("/:candidateId/experience", addExperience);
router.get("/:candidateId/experience", getExperience);

// References
router.post("/:candidateId/references", addReference);
router.get("/:candidateId/references", getReferences);

export default router;
