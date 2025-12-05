import { db } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    console.log("Register attempt:", { email, password, bodyKeys: Object.keys(body) });

    if (!email || !password) {
      console.log("Missing email or password:", { email, password });
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }
    
    const trimmedEmail = String(email).trim();
    const trimmedPassword = String(password).trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      console.log("Email or password is empty after trim");
      return Response.json({ error: "Email and password cannot be empty" }, { status: 400 });
    }

    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [trimmedEmail]);
    if (existing.length > 0) {
      console.log("Email already registered:", trimmedEmail);
      return Response.json({ error: "Email already registered" }, { status: 400 });
    }

    const [result] = await db.query("INSERT INTO users (email, password) VALUES (?, ?)", [trimmedEmail, trimmedPassword]);
    const userId = result.insertId;

    const sessionToken = crypto.randomBytes(32).toString("hex");
    
    await db.query(
      "UPDATE users SET session_token = ? WHERE id = ?",
      [sessionToken, userId]
    );

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return Response.json({ message: "User registered successfully!", userId });

  } catch (error) {
    console.error("Register API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
