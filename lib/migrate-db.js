import { db } from "./db.js";

async function addSessionTokenColumn() {
  try {
    console.log("🔧 Adding session_token column to users table...");

    await db.query(`
      ALTER TABLE users ADD COLUMN session_token VARCHAR(255) AFTER password
    `);
    
    console.log("✅ session_token column added successfully!");
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("ℹ️  session_token column already exists");
      process.exit(0);
    }
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

addSessionTokenColumn();
