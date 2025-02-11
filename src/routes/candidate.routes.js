import { Router } from "express";
import {
  getCandidateProfile,
  updateCandidateSection,
  verifyCandidateEmail,
  validateCandidateOTP,
  getCandidatePersonalInformationByEmail,
} from "../controllers/candidate.controller.js";
import { authenticateCandidate } from "../middlewares/auth.js";

const router = Router();

router.get("/", authenticateCandidate, getCandidatePersonalInformationByEmail);
router.post("/verify_candidate_email", verifyCandidateEmail);
router.post("/validate_candidate_otp", validateCandidateOTP);

router.get("/:candidateId/profile", getCandidateProfile);
router.put("/:candidateId/section", updateCandidateSection);

export default router;
