import { db } from "@/lib/db";
import { getUserFromSession } from "@/lib/auth";

export async function DELETE(req) {
  try {
    const user = await getUserFromSession();
    if (!user) return Response.json({ error: "Not logged in" }, { status: 401 });

    const { quizId } = await req.json();

    if (!quizId) {
      return Response.json({ error: "Quiz ID is required" }, { status: 400 });
    }

    // Verify the quiz belongs to the user
    const [quizzes] = await db.query(
      "SELECT * FROM quizzes WHERE id = ? AND user_id = ?",
      [quizId, user.id]
    );

    if (quizzes.length === 0) {
      return Response.json({ error: "Quiz not found or unauthorized" }, { status: 404 });
    }

    // Delete the quiz (cascading delete will remove questions and choices)
    await db.query("DELETE FROM quizzes WHERE id = ?", [quizId]);

    return Response.json({ message: "Quiz deleted successfully!" });
  } catch (err) {
    console.error("Error deleting quiz:", err);
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
