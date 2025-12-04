import { db } from "@/lib/db";

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

    return Response.json({ message: "Login successful!", userId: rows[0].id });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
