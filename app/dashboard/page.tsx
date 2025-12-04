"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import Image from "next/image";

type Question = { id: number; text: string; choices: string[]; correctIndex: number | null };
type Quiz = { id: number; title: string; questions: Question[] };

export default function Home() {
  const [draftQuestions, setDraftQuestions] = useState<Question[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const questionRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const [mode, setMode] = useState<'edit' | 'answer'>('edit');
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [submitted, setSubmitted] = useState(false); // New state to track if answers have been submitted
  const router = useRouter();

    function handleLogout() {
        router.push("/");
    }

    function addQuestion() {
    setDraftQuestions((prev) => [
      ...prev,
      { id: Date.now() + Math.floor(Math.random() * 1000), text: "", choices: ["", "", "", ""], correctIndex: null },
    ]);
  }

  // Create a new quiz (set) with a name and a number of empty questions, then load it for editing.
  function addQuestionSet(count?: number) {
    const title = window.prompt('Enter a name for the new quiz/set:', `New Quiz ${quizzes.length + 1}`)?.trim();
    if (!title) return;

    let n = typeof count === 'number' && count > 0 ? Math.floor(count) : undefined;
    if (!n) {
      const input = window.prompt('How many questions should this quiz start with?', '1');
      if (!input) return;
      const parsed = parseInt(input, 10);
      if (Number.isNaN(parsed) || parsed <= 0) return;
      n = parsed;
    }

    const questions: Question[] = [];
    for (let i = 0; i < (n ?? 1); i++) {
      questions.push({ id: Date.now() + i + Math.floor(Math.random() * 1000), text: ``, choices: ['', '', '', ''], correctIndex: null });
    }

    const newQuiz: Quiz = { id: Date.now() + Math.floor(Math.random() * 1000), title, questions };
    setQuizzes((prev) => [newQuiz, ...prev]);

    // Load the new quiz into the questionnaire for editing
    setDraftQuestions(questions.map((q) => ({ ...q })));
    setSelectedQuizId(newQuiz.id);
    setMode('edit');
    setSubmitted(false); // Reset submitted state
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

  function finishQuiz() {
    if (draftQuestions.length === 0) {
      alert("Add at least one question before finishing the quiz.");
      return;
    }
    // Require the creator to mark a correct answer for every question
    const missing = draftQuestions.find((q) => q.correctIndex === null || typeof q.correctIndex !== 'number');
    if (missing) {
      const idx = draftQuestions.findIndex((q) => q.id === missing.id) + 1;
      alert(`Please mark the correct answer for question ${idx} before finishing.`);
      // scroll to the question so the creator can set it
      setTimeout(() => scrollToQuestion(missing.id), 80);
      return;
    }
    // If a quiz is already selected (we created it with Add), update that quiz instead of creating a new one.
    const existing = selectedQuizId !== null && quizzes.find((q) => q.id === selectedQuizId);
    const defaultTitle = existing ? quizzes.find((q) => q.id === selectedQuizId)!.title : `Quiz ${quizzes.length + 1}`;
    const title = window.prompt("Enter quiz title:", defaultTitle)?.trim();
    if (!title) return;

    if (existing && selectedQuizId !== null) {
      // Update existing quiz in-place
      setQuizzes((prev) => prev.map((q) => (q.id === selectedQuizId ? { ...q, title, questions: draftQuestions } : q)));
      // Prepare for answering
      const initialAnswers: Record<number, number | null> = {};
      draftQuestions.forEach((q) => (initialAnswers[q.id] = null));
      setAnswers(initialAnswers);
      setMode('answer');
      setSubmitted(false); // Reset submitted state
    } else {
      const newQuiz: Quiz = { id: Date.now(), title, questions: draftQuestions };
      setQuizzes((prev) => [newQuiz, ...prev]);
      // Prepare quiz for answering immediately
      const initialAnswers: Record<number, number | null> = {};
      newQuiz.questions.forEach((q) => (initialAnswers[q.id] = null));
      setAnswers(initialAnswers);
      setSelectedQuizId(newQuiz.id);
      setMode('answer');
      setSubmitted(false); // Reset submitted state
    }
  }

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId) ?? null;

  function viewQuiz(quizId: number) {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return;
    // load questions into questionnaire for viewing/editing
    setDraftQuestions(quiz.questions.map((q) => ({ ...q })));
    const initialAnswers: Record<number, number | null> = {};
    quiz.questions.forEach((q) => (initialAnswers[q.id] = null));
    setAnswers(initialAnswers);
    setSelectedQuizId(quizId);
    setMode('answer');
    setSubmitted(false); // Reset submitted state when viewing a quiz
  }

  function deleteQuiz(quizId: number) {
    if (!window.confirm("Are you sure you want to delete this quiz?")) return;
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    if (selectedQuizId === quizId) {
      setSelectedQuizId(null);
      setDraftQuestions([]);
      setAnswers({});
      setSubmitted(false);
    }
  }

  function scrollToQuestion(id: number) {
    const el = questionRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = el.querySelector("input") as HTMLInputElement | null;
      if (input) input.focus();
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mx-1">
        <div className="flex items-center ml-2">
          <h1 className="text-yellow-300 sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold font-[comic] text-center mt-5">QuizWhizz</h1>
          <Image src="/cheese.png" alt="QuizWhizz Logo" width={90} height={90} className="rounded-full mt-4 mx-1" />
        </div>

        <div className="ml-130">

        </div>

        <div>
          <button 
          onClick={handleLogout}
          className="bg-yellow-300 text-base sm:text-sm md:text-md lg:text-lg xl:text-xl hover:bg-yellow-400 focus:outline-2 focus:outline-offset-2 focus:outline-yellow-400 active:bg-yellow-500 text-black px-10 py-2 mt-10 mb-5 font-bold m-2 ml-10 mr-1 flex items-center whitespace-nowrap overflow-hidden">
            Log out
          </button>
        </div>
      </div>

      <div className="flex justify-center mt-5">
        <div className="w-[20%] h-screen bg-amber-300 ml-1 shadow-lg overflow-auto">
          <div className="px-[10%] bg-yellow-300 py-5">
            <h1 className=" text-black sm:text-md md:text-lg lg:text-xl xl:text-2xl font-bold font-serif">Quizzes</h1>
          </div>

          <div className="p-4">
            {quizzes.length === 0 ? (
              <p className="text-black">No quizzes yet.</p>
              ) : (
                quizzes.map((quiz) => (
                  <div key={quiz.id} className="flex items-center mb-2">
                    <button
                      onClick={() => viewQuiz(quiz.id)}
                      className={`flex-1 text-left px-3 py-2 rounded shadow-lg ${
                        selectedQuizId === quiz.id ? "text-black bg-yellow-300 font-semibold" : "text-yellow-300 bg-black"
                      }`}>
                      {quiz.title}
                    </button>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="ml-2 text-red-500 hover:text-red-700 font-bold"
                      aria-label="Delete quiz"
                    >
                      X
                    </button>
                  </div>
                ))
              )}
          </div>
        </div>

        <div className="w-[60%] h-screen bg-amber-300 shadow-lg relative">
          <div className="px-[5%] bg-yellow-300 py-5">
            <h1 className="text-black sm:text-md md:text-lg lg:text-xl xl:text-2xl font-bold font-serif">Questionnaire</h1>
          </div>

          <div className="px-[5%] py-6 overflow-auto h-[calc(100vh-96px)]">
            {draftQuestions.length === 0 ? (
              <p className="text-black">No questions yet.</p>
              ) : (
              draftQuestions.map((q, qi) => (
                <div
                  key={q.id}
                  ref={(el) => { questionRefs.current[q.id] = el; }}
                  id={`question-${q.id}`}
                  className="mb-6 p-4 bg-black rounded shadow-sm"
                >
                  <label className="block font-semibold mb-2 text-yellow-300">Question {qi + 1}</label>
                  {mode === 'edit' ? (
                    <>
                      <input
                        value={q.text}
                        onChange={(e) => updateQuestionText(q.id, e.target.value)}
                        placeholder="Type the question here"
                        className="w-full mb-3 px-3 py-2 border rounded"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {q.choices.map((c, i) => (
                          <div key={i} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={q.correctIndex === i}
                              onChange={() => setCorrectIndex(q.id, i)}
                              className="accent-yellow-500"
                            />
                            <input
                              value={c}
                              onChange={(e) => updateChoice(q.id, i, e.target.value)}
                              placeholder={`Choice ${i + 1}`}
                              className="flex-1 px-2 py-2 border rounded"
                            />
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
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={answers[q.id] === i}
                              onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                              disabled={submitted} // Disable after submission
                              className="accent-yellow-500"
                            />
                            <span className="text-sm text-amber-200">{c || <em className="text-amber-200">(no choice)</em>}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="absolute bottom-4 left-4 flex items-center space-x-3">
            <button
              onClick={() => addQuestionSet()}
              aria-label="Add question"
              className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-full w-14 h-14 flex items-center justify-center shadow-lg focus:outline-2 focus:outline-offset-2"
            >
              +
            </button>

            {mode === 'edit' ? (
              <button
                onClick={finishQuiz}
                aria-label="Finish quiz"
                className="bg-black text-yellow-300 px-4 py-2 rounded shadow-lg font-semibold focus:outline-2 focus:outline-offset-2">
                Finish
              </button>
            ) : (
              <button
                onClick={() => {
                  // Compute score against correctIndex
                  const quizQuestions = draftQuestions;
                  let correct = 0;
                  let total = quizQuestions.length;
                  quizQuestions.forEach((q) => {
                    const user = answers[q.id];
                    if (typeof q.correctIndex === 'number' && user === q.correctIndex) correct += 1;
                  });
                  const percent = total === 0 ? 0 : Math.round((correct / total) * 100);
                  alert(`Score: ${correct} / ${total} (${percent}%)`);
                  setSubmitted(true); // Set submitted to true after submission
                }}
                disabled={submitted} // Disable submit button after submission
                aria-label="Submit answers"
                className="bg-yellow-300 text-black px-4 py-2 rounded shadow-lg font-semibold focus:outline-2 focus:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answers
              </button>
            )}
          </div>
        </div>

        <div className="w-[20%] h-screen bg-amber-300 mr-1 shadow-lg overflow-auto">
          <div className="px-[10%] bg-yellow-300 py-5">
            <h1 className="text-black sm:text-md md:text-lg lg:text-xl xl:text-2xl whitespace-nowrap font-bold font-serif">Item Navigation</h1>
          </div>

          <div className="p-4">
            {selectedQuiz ? (
              selectedQuiz.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => {
                    // ensure questionnaire has the quiz loaded, then scroll to the item
                    if (!draftQuestions.find((dq) => dq.id === q.id)) {
                      setDraftQuestions(selectedQuiz.questions.map((s) => ({ ...s })));
                      // wait a tick for DOM to update before scrolling
                      setTimeout(() => scrollToQuestion(q.id), 60);
                    } else {
                      scrollToQuestion(q.id);
                    }
                  }}
                  className="w-full text-left mb-2 px-2 py-2 bg-black rounded">
                  <div className="font-semibold text-yellow-300">Item {i + 1}</div>
                  <div className="text-sm text-amber-200">{q.text || <em className="text-amber-200">(no text)</em>}</div>
                </button>
              ))
            ) : (
              <p className="text-black">Select a quiz to see its items.</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-[20%] h-15 bg-yellow-300 ml-1 "></div>
        <div className="w-[60%] h-15 bg-yellow-300 "></div>
        <div className="w-[20%] h-15 bg-yellow-300 mr-1  flex justify-center">
        </div>
      </div>

      <footer className="text-center mt-10 text-gray-500">
        &copy; 2025 QuizWhizz. All rights reserved.
      </footer>
    </div>
  );
}
function useEffect(arg0: () => void, arg1: never[]) {
  throw new Error("Function not implemented.");
}

