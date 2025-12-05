"use client";
import Image from "next/image"
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [message, setMessage] = useState("");



async function handleLogin(e: any) {
  e.preventDefault();

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data?.error || "Login failed");
      alert(data?.error || "Login failed");
    } else {
      setMessage("Login successful!");
      router.push("/dashboard");
    }
  } catch (err) {
    setMessage("Network error");
    alert("Network error");
  }
}

  return (
    <div className="min-h-screen bg-black px-4 py-10 items-center justify-center flex flex-col">
        <div className="flex mb-10">
                 <h1 className="text-yellow-300 sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold font-[comic] text-center mt-5">QuizWhizz</h1>
                 <Image src="/cheese.png" alt="QuizWhizz" width={120} height={120} className="rounded-full mx-1" />
                 </div>
      <div className="w-full max-w-sm bg-yellow-300 p-6 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-black">Log In</h1>

        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="p-2 border rounded-lg bg-amber-300 text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="p-2 border rounded-lg bg-amber-300 text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-700"
          >
            Login
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-black">
          Don't have an account?{" "}
          <span
            onClick={() => router.push("/")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Signup here
          </span>
        </p>
      </div>
    </div>
  );
}
