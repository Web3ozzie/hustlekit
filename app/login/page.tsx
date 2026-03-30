"use client";

import { useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // email OR HustleID OR phone
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveEmailFromIdentifier(id: string): Promise<string | null> {
    const trimmed = id.trim();

    if (trimmed.includes("@")) {
      return trimmed.toLowerCase(); // email
    }

    if (trimmed.startsWith("HK-")) {
      const qUsers = query(
        collection(db, "users"),
        where("hustleId", "==", trimmed)
      );
      const snap = await getDocs(qUsers);
      if (!snap.empty) {
        const data: any = snap.docs[0].data();
        return data.email ?? null;
      }
      return null;
    }

    // assume phone
    const qUsers = query(
      collection(db, "users"),
      where("phone", "==", trimmed)
    );
    const snap = await getDocs(qUsers);
    if (!snap.empty) {
      const data: any = snap.docs[0].data();
      return data.email ?? null;
    }

    return null;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const email = await resolveEmailFromIdentifier(identifier);
      if (!email) {
        setError("Could not find an account for that email / ID / phone.");
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/home";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      window.location.href = "/home";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

 return (
  <div className="min-h-screen flex items-center justify-center bg-black text-white">
    <div className="w-full max-w-md p-6 bg-gray-900/80 rounded-2xl border border-gray-800 shadow-[0_0_40px_rgba(0,0,0,0.9)]">
      <h1 className="text-2xl font-semibold mb-2">Login</h1>
      <p className="text-xs text-gray-400 mb-4">
        Step back into the Armory.
      </p>

      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email, HustleID (HK-XXXXXX) or phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-black border border-gray-700 text-sm placeholder:text-gray-500 focus:outline-none focus:border-green-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-black border border-gray-700 text-sm placeholder:text-gray-500 focus:outline-none focus:border-green-500"
        />

        {error && (
          <p className="text-xs text-green-400 mb-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="relative w-full py-[2px] rounded-2xl disabled:opacity-70
                     bg-green-600
                     animate-[pulseGlowGreen_2s_ease-in-out_infinite]"
        >
          <span
            className="block w-full rounded-2xl bg-black text-xs font-semibold
                       text-white py-2"
          >
            {loading ? "Loading..." : "Login"}
          </span>
        </button>
      </form>

      <button
        type="button"
        onClick={handleGoogle}
        className="w-full py-2 rounded-2xl bg-gray-900 text-xs mb-2 border border-gray-700"
      >
        Sign in with Google
      </button>

      <div className="flex justify-between text-[11px] text-gray-400 mt-3">
        <a href="/forgot-password" className="underline">
          Forgot password?
        </a>
        <a href="/enter-armory" className="underline">
          New here? Enter Armory
        </a>
      </div>
    </div>
  </div>
);
}