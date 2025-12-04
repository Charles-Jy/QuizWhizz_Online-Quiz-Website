import { db } from "./db.js";

async function testConnection() {
  try {
    const [rows] = await db.query("SELECT NOW() AS now");
    console.log("✅ Database connected! Current time:", rows[0].now);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
}

testConnection();
