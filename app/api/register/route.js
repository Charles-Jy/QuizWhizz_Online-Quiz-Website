import { db } from "@/lib/db";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const [existing] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return Response.json({ error: "Email already registered" }, { status: 400 });
    }

    await db.query("INSERT INTO users (email, password) VALUES (?, ?)", [email, password]);

    return Response.json({ message: "User registered successfully!" });

  } catch (error) {
    console.error("Register API Error:", error);  // 🔥 Log the real error
    return Response.json({ error: error.message }, { status: 500 });
  }
}
