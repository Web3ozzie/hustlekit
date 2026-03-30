"use client";

import { useState } from "react";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

const provider = new GoogleAuthProvider();

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // Email or HustleID or phone (email used for auth)
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identifier || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      // For now, treat identifier as email
      await signInWithEmailAndPassword(auth, identifier, password);
      window.location.href = "/home";
    } catch (e: any) {
      setError(e.message || "Could not log you in.");
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
      setError(e.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  function openWhatsAppSupport() {
    if (typeof window === "undefined") return;
    window.open(
      "https://wa.me/2348117571121?text=Hey%20HustleKit%2C%20I%20need%20help%20logging%20in",
      "_blank"
    );
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

          <div className="relative mb-2">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-sm"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

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
          className="w-full py-2 rounded-2xl bg-gray-900 text-xs mb-2 border border-gray-700 mt-2"
        >
          Sign in with Google
        </button>

        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
          <span>Need help?</span>
          <button
            type="button"
            onClick={openWhatsAppSupport}
            className="inline-flex items-center justify-center px-3 h-8 rounded-full bg-[#25D366]/10 border border-[#25D366]/40 hover:border-[#25D366] text-[11px] text-[#25D366]"
            aria-label="Chat with support on WhatsApp"
          >
            WhatsApp
          </button>
        </div>

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