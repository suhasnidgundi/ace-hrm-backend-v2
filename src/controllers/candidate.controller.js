import { candidateService } from "../services/candidate.service.js";
import { logger } from "../config/logger.js";
import { CustomError } from "../utils/customError.js";

export const getCandidatePersonalInformationByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) throw new CustomError("Email is required", 400);

    // Ensure authenticated candidate is requesting their own data
    if (req.candidate.email !== email) {
      throw new CustomError(
        "Unauthorized: Access denied to another candidate's data",
        403
      );
    }

    const candidate = await candidateService.getCandidateByEmail(email);
    return res.json({
      success: true,
      isNewCandidate: !candidate,
      data: candidate,
    });
  } catch (error) {
    logger.error("Error in getCandidatePersonalInformationByEmail:", error);
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

export const registerCandidate = async (req, res) => {
  try {
    const { email, ...candidateData } = req.body;
    if (!email) throw new CustomError("Email is required", 400);

    const candidate = await candidateService.upsertCandidate(
      email,
      candidateData
    );
    return res.json({ success: true, data: candidate });
  } catch (error) {
    logger.error("Error in registerCandidate:", error);
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

export const updateCandidateSection = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { section } = req.query;
    const sectionData = req.body;

    if (!candidateId) throw new CustomError("Candidate ID is required", 400);
    if (!section) throw new CustomError("Section is required", 400);

    let updatedData;
    switch (section) {
      case "qualifications":
        updatedData = await candidateService.upsertQualification(
          candidateId,
          sectionData
        );
        break;
      case "personalInformation":
        updatedData = await candidateService.upsertPersonalInformation(
          candidateId,
          sectionData
        );
        break;
      case "experience":
        updatedData = await candidateService.upsertExperience(
          candidateId,
          sectionData
        );
        break;
      case "references":
        updatedData = await candidateService.upsertReference(
          candidateId,
          sectionData
        );
        break;
      default:
        throw new CustomError("Invalid section specified", 400);
    }

    const progress = await candidateService.calculateProgress(candidateId);
    return res.json({ success: true, data: updatedData, progress });
  } catch (error) {
    logger.error("Error in updateCandidateSection:", error);
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

export const getCandidateProfile = async (req, res) => {
  try {
    const { candidateId } = req.params;
    if (!candidateId) throw new CustomError("Candidate ID is required", 400);

    const profile = await candidateService.getCandidateProfile(candidateId);
    return res.json({ success: true, data: profile });
  } catch (error) {
    logger.error("Error in getCandidateProfile:", error);
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

export const verifyCandidateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) throw new CustomError("Email is required", 400);

    const verificationToken = await candidateService.verifyCandidateEmail(
      email
    );
    return res.status(200).json({ success: true, verificationToken });
  } catch (error) {
    logger.error("Error in verifyCandidateEmail:", error);
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};

export const validateCandidateOTP = async (req, res) => {
  try {
    const { verificationToken, otp } = req.body;
    if (!verificationToken || !otp)
      throw new CustomError("Verification token and OTP are required", 400);

    const accessToken = await candidateService.validateCandidateOTP(
      verificationToken,
      otp
    );
    return res.status(200).json({ success: true, accessToken });
  } catch (error) {
    logger.error("Error in validateCandidateOTP:", error);
    return res
      .status(error.status || 500)
      .json({ success: false, message: error.message });
  }
};
