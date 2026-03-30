"use client";

import { useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  createUserWithEmailAndPassword,
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

  async function handleEmailSignup() {
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
      setError(e.message);
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Placeholder until you wire real phone+OTP
  async function handlePhoneSignup() {
    setError("Phone signup will use OTP; wire this next.");
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
              mode === "email" ? "bg-green-600" : "bg-gray-800"
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setMode("phone")}
            className={`flex-1 py-2 rounded ${
              mode === "phone" ? "bg-green-600" : "bg-gray-800"
            }`}
          >
            Phone
          </button>
        </div>

        {mode === "email" ? (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-2 p-2 rounded bg-gray-800 border border-gray-700 text-sm"
          />
        ) : (
          <input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mb-2 p-2 rounded bg-gray-800 border border-gray-700 text-sm"
          />
        )}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-2 p-2 rounded bg-gray-800 border border-gray-700 text-sm"
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-gray-800 border border-gray-700 text-sm"
        />

        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
<button
  type="button"
  disabled={loading}
  onClick={mode === "email" ? handleEmailSignup : handlePhoneSignup}
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
  className="w-full py-2 rounded-2xl bg-gray-900 text-xs mb-2 border border-gray-700"
>
  Sign in with Google
        </button>

        <div className="flex justify-between text-[11px] text-gray-400 mt-3">
          <a href="/login" className="hover:underline">
            Already inside? Login
          </a>
        </div>
      </div>
    </div>
  );
}