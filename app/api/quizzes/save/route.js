import { db } from "@/lib/db";
import { getUserFromSession } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await getUserFromSession(); // ✅ server-side, awaited
    if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

    const body = await req.json();
    const { title, questions } = body;

    if (!title || !questions?.length)
      return Response.json({ error: "Invalid data" }, { status: 400 });

    const result = await db.query(
      "INSERT INTO quizzes (user_id, title) VALUES (?, ?)",
      [user.id, title]
    );
    const quizId = result[0].insertId;

    for (const q of questions) {
      const qResult = await db.query(
        "INSERT INTO questions (quiz_id, text, correct_index) VALUES (?, ?, ?)",
        [quizId, q.text, q.correctIndex]
      );
      const questionId = qResult[0].insertId;

      for (const choice of q.choices) {
        await db.query(
          "INSERT INTO choices (question_id, text) VALUES (?, ?)",
          [questionId, choice]
        );
      }
    }

    return Response.json({ message: "Quiz saved successfully!" });
  } catch (err) {
    console.error("Error saving quiz:", err);
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
