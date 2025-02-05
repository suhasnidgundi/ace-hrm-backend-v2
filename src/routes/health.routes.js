import { Router } from "express";
import { db } from "../db/index.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    // Check database connection
    await db.select(1);

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        api: "up",
        database: "up",
      },
      version: process.env.npm_package_version,
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        api: "up",
        database: "down",
      },
      error: error.message,
    });
  }
});

export default router;
