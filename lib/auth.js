import { cookies } from "next/headers";
import { db } from "./db";

export async function getUserFromSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) return null;

  const [rows] = await db.query(
    "SELECT * FROM users WHERE session_token = ?",
    [sessionCookie]
  );

  return rows[0] || null;
}
