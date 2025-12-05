"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { checkAuth } from "@/lib/auth-client";

type Question = { id: number; text: string; choices: string[]; correctIndex: number | null };
type Quiz = { id: number; title: string; questions: Question[] };

export default function Dashboard() {
  const router = useRouter();

  const [draftQuestions, setDraftQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [mode, setMode] = useState<"edit" | "answer">("edit");
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const questionRefs = React.useRef<Record<number, HTMLDivElement | null>>({});


async function loadQuizzes() {
  try {
    const res = await fetch("/api/quizzes/load");
    const data = await res.json();

    if (!res.ok) return console.error("Failed to load quizzes:", data.error);

    setQuizzes(data.quizzes);
  } catch (err) {
    console.error("Failed to load quizzes:", err);
  }
}

 useEffect(() => {
    async function checkAuthentication() {
      setIsLoading(true);
      const user = await checkAuth();
      if (!user) {
        router.push("/login");
        return;
      }
      setIsAuthenticated(true);
      
      try {
        const res = await fetch("/api/quizzes/load");
        const data = await res.json();
        if (!res.ok) return console.error("Failed to load quizzes:", data.error);

        setQuizzes(data.quizzes);
      } catch (err) {
        console.error("Failed to load quizzes:", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuthentication();
  }, [router]);

  function handleLogout() {
    router.push("/");
  }

  function addQuestion() {
    setDraftQuestions((prev) => [
      ...prev,
      { id: Date.now(), text: "", choices: ["", "", "", ""], correctIndex: null },
    ]);
  }

  function addQuestionSet() {
    const title = window.prompt("Enter a name for the new quiz:", `New Quiz ${quizzes.length + 1}`);
    if (!title) return;

    const nInput = window.prompt("How many questions should this quiz start with?", "1");
    if (!nInput) return;
    const n = parseInt(nInput);
    if (isNaN(n) || n <= 0) return;

    const questions: Question[] = Array.from({ length: n }, (_, i) => ({
      id: Date.now() + i,
      text: "",
      choices: ["", "", "", ""],
      correctIndex: null,
    }));

    setDraftQuestions(questions);
    setSelectedQuizId(null);
    setMode("edit");
    setSubmitted(false);
  }

  function updateQuestionText(id: number, text: string) {
    setDraftQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, text } : q)));
  }

  function updateChoice(id: number, idx: number, value: string) {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, choices: q.choices.map((c, i) => (i === idx ? value : c)) } : q))
    );
  }

  function setCorrectIndex(id: number, idx: number) {
    setDraftQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, correctIndex: idx } : q)));
  }

  function scrollToQuestion(id: number) {
    const el = questionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = el.querySelector("input") as HTMLInputElement | null;
      if (input) input.focus();
    }
  }

async function finishQuiz() {
  if (draftQuestions.length === 0) return alert("Add at least one question!");

  const missing = draftQuestions.find(q => q.correctIndex === null);
  if (missing) {
    scrollToQuestion(missing.id);
    return alert("Mark the correct answer for all questions!");
  }

  const title = window.prompt("Enter quiz title:", `Quiz ${quizzes.length + 1}`);
  if (!title) return;

  try {
    const res = await fetch("/api/quizzes/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, questions: draftQuestions })
    });

    const data = await res.json();

    if (!res.ok) return alert("Failed to save quiz: " + data.error);

    alert("Quiz saved successfully!");
    
    try {
      const reloadRes = await fetch("/api/quizzes/load");
      const reloadData = await reloadRes.json();
      if (reloadRes.ok) {
        setQuizzes(reloadData.quizzes);

        const newQuiz = reloadData.quizzes[reloadData.quizzes.length - 1];
        if (newQuiz) {
          viewQuiz(newQuiz.id);
        }
      }
    } catch (err) {
      console.error("Failed to reload quizzes:", err);
    }
    
    setDraftQuestions([]);
    setSelectedQuizId(null);
    setMode("answer");
    setSubmitted(false);
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    alert("Failed to save quiz: " + errorMessage);
  }
}

  function viewQuiz(quizId: number) {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;
    setDraftQuestions(quiz.questions.map((q) => ({ ...q })));
    setSelectedQuizId(quizId);
    setMode("answer");
    setAnswers(quiz.questions.reduce((acc, q) => ({ ...acc, [q.id]: null }), {}));
    setSubmitted(false);
  }

  async function deleteQuiz(quizId: number) {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    
    try {
      const res = await fetch("/api/quizzes/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId })
      });

      const data = await res.json();

      if (!res.ok) {
        return alert("Failed to delete quiz: " + data.error);
      }

      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
      
      if (selectedQuizId === quizId) {
        setSelectedQuizId(null);
        setDraftQuestions([]);
        setAnswers({});
        setSubmitted(false);
      }

      alert("Quiz deleted successfully!");
    } catch (err) {
      console.error("Error deleting quiz:", err);
      alert("Failed to delete quiz");
    }
  }

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId) ?? null;

  function submitAnswers() {
    if (!selectedQuiz) return;
    let correct = 0;
    selectedQuiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctIndex) correct += 1;
    });
    const percent = Math.round((correct / selectedQuiz.questions.length) * 100);
    alert(`Score: ${correct} / ${selectedQuiz.questions.length} (${percent}%)`);
    setSubmitted(true);
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-black text-yellow-300 text-xl">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen bg-black text-yellow-300 text-xl">Redirecting to login...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mx-1">
        <div className="flex items-center ml-2">
          <h1 className="text-yellow-300 sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold font-[comic] text-center mt-5">QuizWhizz</h1>
          <Image src="/cheese.png" alt="QuizWhizz Logo" width={90} height={90} className="rounded-full mt-4 mx-1" />
        </div>
        <div>
          <button onClick={handleLogout} className="bg-yellow-300 text-black px-10 py-2 mt-10 mb-5 font-bold m-2 ml-10 mr-1">
            Log out
          </button>
        </div>
      </div>

      <div className="flex justify-center mt-5">
        <div className="w-[20%] h-screen bg-amber-300 ml-1 shadow-lg overflow-auto">
          <div className="px-[10%] bg-yellow-300 py-5">
            <h1 className="text-black text-xl font-bold font-serif">Quizzes</h1>
          </div>
          <div className="p-4">
            {quizzes.length === 0 ? <p className="text-black">No quizzes yet.</p> :
              quizzes.map((quiz) => (
                <div key={quiz.id} className="flex items-center mb-2">
                  <button onClick={() => viewQuiz(quiz.id)}
                    className={`flex-1 text-left px-3 py-2 rounded shadow-lg ${
                      selectedQuizId === quiz.id ? "text-black bg-yellow-300 font-semibold" : "text-yellow-300 bg-black"
                    }`}>
                    {quiz.title}
                  </button>
                  <button onClick={() => deleteQuiz(quiz.id)} className="ml-2 text-red-500 hover:text-red-700 font-bold">X</button>
                </div>
              ))}
          </div>
        </div>

        <div className="w-[60%] h-screen bg-amber-300 shadow-lg relative">
          <div className="px-[5%] bg-yellow-300 py-5">
            <h1 className="text-black text-xl font-bold font-serif">Questionnaire</h1>
          </div>
          <div className="px-[5%] py-6 overflow-auto h-[calc(100vh-96px)]">
            {draftQuestions.length === 0 ? <p className="text-black">No questions yet.</p> :
              draftQuestions.map((q, qi) => (
                <div key={q.id} ref={(el) => { questionRefs.current[q.id] = el; }} className="mb-6 p-4 bg-black rounded shadow-sm">
                  <label className="block font-semibold mb-2 text-yellow-300">Question {qi + 1}</label>
                  {mode === "edit" ? (
                    <>
                      <input value={q.text} onChange={(e) => updateQuestionText(q.id, e.target.value)}
                        placeholder="Type the question here"
                        className="w-full mb-3 px-3 py-2 border rounded" />
                      <div className="grid grid-cols-2 gap-2">
                        {q.choices.map((c, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === i} onChange={() => setCorrectIndex(q.id, i)} className="accent-yellow-500" />
                            <input value={c} onChange={(e) => updateChoice(q.id, i, e.target.value)}
                              placeholder={`Choice ${i + 1}`} className="flex-1 px-2 py-2 border rounded" />
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div>
                      <div className="mb-3 text-amber-200">{q.text || <em className="text-amber-200">(no text)</em>}</div>
                      <div className="grid grid-cols-1 gap-2">
                        {q.choices.map((c, i) => (
                          <label key={i} className="flex items-center space-x-2 px-2 py-1 bg-black rounded border border-yellow-300">
                            <input type="radio" name={`q-${q.id}`} checked={answers[q.id] === i} onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))} disabled={submitted} className="accent-yellow-500" />
                            <span className="text-sm text-amber-200">{c || <em className="text-amber-200">(no choice)</em>}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>

          <div className="absolute bottom-4 left-4 flex items-center space-x-3">
            <button onClick={addQuestionSet} className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg">+</button>
            {mode === "edit" ? (
              <button onClick={finishQuiz} className="bg-black text-yellow-300 px-4 py-2 rounded shadow-lg font-semibold">
                Finish
              </button>
            ) : (
              <button onClick={submitAnswers} disabled={submitted} className="bg-yellow-300 text-black px-4 py-2 rounded shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                Submit Answers
              </button>
            )}
          </div>
        </div>

        <div className="w-[20%] h-screen bg-amber-300 mr-1 shadow-lg overflow-auto">
          <div className="px-[10%] bg-yellow-300 py-5">
            <h1 className="text-black text-xl font-bold font-serif">Item Navigation</h1>
          </div>
          <div className="p-4">
            {selectedQuiz ? selectedQuiz.questions.map((q, i) => (
              <button key={q.id} onClick={() => scrollToQuestion(q.id)} className="w-full text-left mb-2 px-2 py-2 bg-black rounded">
                <div className="font-semibold text-yellow-300">Item {i + 1}</div>
                <div className="text-sm text-amber-200">{q.text || <em className="text-amber-200">(no text)</em>}</div>
              </button>
            )) : <p className="text-black">Select a quiz to see its items.</p>}
          </div>
        </div>
      </div>

      <footer className="text-center mt-10 text-gray-500">&copy; 2025 QuizWhizz. All rights reserved.</footer>
    </div>
  );
}
