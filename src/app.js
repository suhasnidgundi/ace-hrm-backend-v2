import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { json } from "express";
import router from "./routes/index.js";

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors());
app.use(json());
app.use(morgan("dev"));

// Routes
app.use("/", router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;
