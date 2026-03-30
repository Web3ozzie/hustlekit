"use client";

import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setDone(true);
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-6 bg-gray-900 rounded-2xl border border-gray-800">
        <h1 className="text-2xl font-semibold mb-2">Forgot password?</h1>
        <p className="text-xs text-gray-400 mb-4">
          We’ll send a reset link to your email.
        </p>

        {done ? (
          <p className="text-xs text-green-400">
            Check your email for a reset link.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-2 p-2 rounded bg-gray-800 border border-gray-700 text-sm"
            />
            {error && (
              <p className="text-xs text-red-400 mb-2">{error}</p>
            )}
            <button
              type="submit"
              className="w-full py-2 rounded bg-green-600 hover:bg-green-700 text-sm font-semibold"
            >
              Send reset link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}