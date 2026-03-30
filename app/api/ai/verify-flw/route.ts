import { NextResponse } from "next/server";
import { db } from "../../../lib/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tx_ref = searchParams.get("tx_ref");
  const transaction_id = searchParams.get("transaction_id");
  const userId = searchParams.get("userId");

  if (!status || !tx_ref || !transaction_id || !userId) {
    return NextResponse.json(
      { ok: false, reason: "Missing params" },
      { status: 400 }
    );
  }

  const res = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    }
  );

  const data = await res.json();

  const ok =
    data.status === "success" &&
    data.data?.status === "successful" &&
    data.data?.amount === 1500 &&
    data.data?.currency === "NGN";

  if (!ok) {
    return NextResponse.json(
      { ok: false, reason: "Verification failed" },
      { status: 400 }
    );
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  // 1. Save expiry
  await setDoc(
    doc(db, "toolSubs", userId),
    { expiresAt: expiresAt.toISOString() },
    { merge: true }
  );

  // 2. Mark user as subscribed
  await updateDoc(doc(db, "users", userId), {
    hasToolsSub: true,
  });

  return NextResponse.json({ ok: true });
}