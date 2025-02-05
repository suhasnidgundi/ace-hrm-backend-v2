import app from "./app.js";
import { config } from "dotenv";
import { testConnection } from "./db/index.js";

config(); // Load environment variables

const PORT = process.env.PORT || 3000;

// Start server with enhanced error handling
async function startServer() {
  try {
    // Test database connection first
    await testConnection();

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Handle server shutdown gracefully
    const shutdown = async () => {
      console.log("Shutting down server...");
      server.close(() => {
        console.log("Server shut down successfully");
        process.exit(0);
      });
    };

    // Handle process signals
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

startServer();
