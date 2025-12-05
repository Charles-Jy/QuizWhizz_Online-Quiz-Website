import { db } from "@/lib/db";
import { getUserFromSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getUserFromSession();
    if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

    const [quizzes] = await db.query(
      "SELECT id, title FROM quizzes WHERE user_id = ? ORDER BY id DESC",
      [user.id]
    );

    for (const quiz of quizzes) {
      const [questions] = await db.query(
        "SELECT id, text, correct_index FROM questions WHERE quiz_id = ?",
        [quiz.id]
      );

      for (const q of questions) {
        const [choices] = await db.query(
          "SELECT text FROM choices WHERE question_id = ? ORDER BY id ASC",
          [q.id]
        );
        q.choices = choices.map(c => c.text);
      }

      quiz.questions = questions;
    }

    return Response.json({ quizzes });
  } catch (err) {
    console.error("Error loading quizzes:", err);
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
