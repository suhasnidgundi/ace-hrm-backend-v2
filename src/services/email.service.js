import axios from "axios";
import { logger } from "../config/logger.js";

class EmailService {
  constructor() {
    this.serviceId = process.env.EMAILJS_SERVICE_ID;
    this.templateId = process.env.EMAILJS_TEMPLATE_ID;
    this.publicKey = process.env.EMAILJS_PUBLIC_KEY;
    this.privateKey = process.env.EMAILJS_PRIVATE_KEY;
    this.apiUrl = "https://api.emailjs.com/api/v1.0/email/send";
  }

  async sendOTP(email, otp) {
    try {
      const data = {
        service_id: this.serviceId,
        template_id: this.templateId,
        user_id: this.publicKey,
        accessToken: this.privateKey,
        template_params: {
          to_email: email,
          otp_code: otp,
          company_name: "ACE Hospital",
        },
      };

      const response = await axios.post(this.apiUrl, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      logger.info("OTP email sent successfully", { email });
      return response.data;
    } catch (error) {
      logger.error("Failed to send OTP email:", {
        error: error.response?.data || error.message,
        email,
      });
      throw new Error("Failed to send OTP email");
    }
  }
}

export const emailService = new EmailService();
