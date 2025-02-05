import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import "dotenv/config";

// Enhanced pool configuration
const poolConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Create drizzle instance
export const db = drizzle(poolConnection);

// Export pool for direct usage if needed
export const pool = poolConnection;

// Test connection function
export const testConnection = async () => {
  try {
    const connection = await poolConnection.getConnection();
    console.log("Database connected successfully");
    connection.release();
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
};

export default db;
