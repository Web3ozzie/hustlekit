"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type HustleUser = {
  username: string;
  hustleId: string;
};

export default function HomePage() {
  const [user, setUser] = useState<HustleUser | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        return;
      }

      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);
      const data = snap.data() as any;

      setUser({
        username:
          data?.username ||
          firebaseUser.displayName ||
          firebaseUser.email?.split("@")[0] ||
          "Hustler",
        hustleId: data?.hustleId || "HK-XXXXXX",
      });
    });

    return () => unsub();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xs text-gray-400">Loading your Armory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="px-6 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold">
            <span className="text-white">Hustle</span>
            <span className="text-orange-400">Kit</span>
          </h1>

          <Link
            href="/hustlekit?tab=profile"
            className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-xs font-semibold"
          >
            H+
          </Link>
        </div>

        {/* Welcome */}
       <header className="mb-6">
  <p className="text-xs text-gray-500">Welcome back,</p>
  <h2 className="text-2xl font-semibold">{user.username}</h2>
</header>

        {/* Hero copy */}
        <section className="mb-6">
  <h3 className="text-xl font-semibold mb-1">
    Your all‑in‑one hustle dashboard.
  </h3>
  <p className="text-xs text-gray-400">
    Find work, move properties, track investments and use smart tools — all in one place.
  </p>
</section>

        {/* Cards grid */}
        <section className="space-y-4">
          {/* Earn */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Earn money</h4>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/hustlekit?tab=jobs"
                className="bg-gray-900/70 p-4 rounded-2xl border border-gray-800 hover:border-green-500 transition"
              >
                <h5 className="font-semibold mb-1 text-orange-300">Bag a Job</h5>
                <p className="text-[11px] text-gray-400">
                  Discover roles, gigs, and side hustles that fit your goals.
                </p>
              </Link>

              <Link
                href="/hustlekit?tab=investments"
                className="bg-gray-900/70 p-4 rounded-2xl border border-gray-800 hover:border-green-500 transition"
              >
                <h5 className="font-semibold mb-1 text-orange-300">Flip a Property</h5>
                <p className="text-[11px] text-gray-400">
                  List or find real estate deals across the city.
                </p>
              </Link>
            </div>
          </div>

          {/* Grow & connect */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">
              Grow money & connect
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/hustlekit?tab=investments"
                className="bg-gray-900/70 p-4 rounded-2xl border border-gray-800 hover:border-green-500 transition"
              >
                <h5 className="font-semibold mb-1 text-orange-300">Invest Your Bag</h5>
                <p className="text-[11px] text-gray-400">
                  Watch crypto, stocks & hard assets in one clean view.
                </p>
              </Link>

              <Link
                href="/hustlekit?tab=chat"
                className="bg-gray-900/70 p-4 rounded-2xl border border-gray-800 hover:border-green-500 transition"
              >
                <h5 className="font-semibold mb-1 text-orange-300">Talk to Hustlers</h5>
                <p className="text-[11px] text-gray-400">
                  DM landlords, founders and other hustlers directly.
                </p>
              </Link>
            </div>
          </div>

          {/* Tools */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2">Smart tools</h4>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/hustlekit?tab=tools"
                className="bg-gray-900/70 p-4 rounded-2xl border border-gray-800 hover:border-green-500 transition"
              >
                <h5 className="font-semibold mb-1 text-orange-300">Hustle Tools</h5>
                <p className="text-[11px] text-gray-400">
                  AI CVs, letters, invoices & profit calculators to power your hustle.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}