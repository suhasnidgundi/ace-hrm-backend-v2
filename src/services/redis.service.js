// src/services/redis.service.js
import Redis from "ioredis";
import { logger } from "../config/logger.js";

class RedisService {
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
    });

    this.redis.on("error", (error) => {
      logger.error("Redis connection error:", error);
    });
  }

  async setOTP(email, otp) {
    // OTP expires in 10 minutes
    await this.redis.set(`otp:${email}`, otp, "EX", 600);
  }

  async getOTP(email) {
    return await this.redis.get(`otp:${email}`);
  }

  async deleteOTP(email) {
    await this.redis.del(`otp:${email}`);
  }
}

export const redisService = new RedisService();
