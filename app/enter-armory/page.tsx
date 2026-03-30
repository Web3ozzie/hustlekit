"use client";

import { useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { makeDefaultUsername, makeHustleId } from "../lib/userHelpers";
import type { UserDoc } from "../lib/type";

const provider = new GoogleAuthProvider();

export default function EnterArmory() {
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureUserDoc(user: any) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return;

    const username = makeDefaultUsername(user.email ?? null);
    const hustleId = makeHustleId();

    const userData: UserDoc = {
      email: user.email ?? null,
      phone: user.phoneNumber ?? null,
      username,
      hustleId,
      createdAt: new Date().toISOString(),
    };

    await setDoc(ref, userData);

    try {
      await updateProfile(user, { displayName: username });
    } catch {}
  }

  // EMAIL: signup then fallback to login if email already in use
  async function handleEmailAuth() {
    setError(null);

    if (!email || !password || !confirm) {
      setError("Fill all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(cred.user);
      window.location.href = "/home";
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        try {
          const loginCred = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
          await ensureUserDoc(loginCred.user);
          window.location.href = "/home";
        } catch (loginErr: any) {
          setError(
            "This email already has an account. Check your password or tap Login."
          );
        }
      } else {
        setError(e.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, provider);
      await ensureUserDoc(cred.user);
      window.location.href = "/home";
    } catch (e: any) {
      setError(e.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  // TEMP: phone disabled until billing is on
  function handlePhoneSoon() {
    setError("Phone sign-in is coming soon. For now, use email or Google.");
  }

  const isEmailMode = mode === "email";

  function openWhatsAppSupport() {
    if (typeof window === "undefined") return;
    window.open(
      "https://wa.me/2348117571121?text=Hey%20HustleKit%2C%20I%20need%20help%20entering%20the%20Armory",
      "_blank"
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-6 bg-gray-900 rounded-2xl border border-gray-800">
        <h1 className="text-2xl font-semibold mb-2">Enter Armory</h1>
        <p className="text-xs text-gray-400 mb-4">
          Lock in your HustleID to bag deals.
        </p>

        <div className="flex gap-2 mb-4 text-xs">
          <button
            onClick={() => setMode("email")}
            className={`flex-1 py-2 rounded ${
              isEmailMode ? "bg-green-600" : "bg-gray-800"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setMode("phone")}
            className={`flex-1 py-2 rounded ${
              !isEmailMode ? "bg-green-600" : "bg-gray-800"
            }`}
          >
            Phone
          </button>
        </div>

        {isEmailMode ? (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-2 p-2 rounded bg-gray-800 border border-gray-700 text-sm"
            />

            <div className="relative mb-2">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 pr-12 rounded bg-gray-800 border border-gray-700 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="relative mb-3">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full p-2 pr-12 rounded bg-gray-800 border border-gray-700 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400"
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              type="tel"
              placeholder="Phone number (e.g. +234...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full mb-2 p-2 rounded bg-gray-800 border border-gray-700 text-sm"
            />
            <p className="text-[11px] text-gray-400 mb-3">
              Phone sign-in will use OTP. Turn on billing in Firebase to
              activate it; for now, use email or Google.
            </p>
          </>
        )}

        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

        <button
          type="button"
          disabled={loading}
          onClick={isEmailMode ? handleEmailAuth : handlePhoneSoon}
          className="relative w-full py-[2px] rounded-2xl disabled:opacity-70
                     bg-green-600
                     animate-[pulseGlowGreen_2s_ease-in-out_infinite]"
        >
          <span
            className="block w-full rounded-2xl bg-black text-xs font-semibold
                       text-white py-2"
          >
            {loading ? "Loading..." : "Enter Armory"}
          </span>
        </button>

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
          <a href="/login" className="hover:underline">
            Already inside? Login
          </a>
        </div>
      </div>
    </div>
  );
}