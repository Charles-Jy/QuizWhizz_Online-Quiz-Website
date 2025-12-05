import { db } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? AND password = ?",
      [email, password]
    );

    if (rows.length === 0) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = rows[0];
    
    // Generate a session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    
    // Update user with session token in database
    await db.query(
      "UPDATE users SET session_token = ? WHERE id = ?",
      [sessionToken, user.id]
    );

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return Response.json({ message: "Login successful!", userId: user.id });

  } catch (error) {
    console.error("Login API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
