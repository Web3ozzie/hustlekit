import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("SUBSCRIBE-TOOLS HIT");

  try {
    const body = await req.json();
    const { userId, email } = body;

    if (!userId || !email) {
      console.log("MISSING FIELDS", { userId, email });
      return NextResponse.json(
        { error: "Missing userId or email" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: `tools-${userId}-${Date.now()}`,
        amount: 1500,
        currency: "NGN",
        payment_plan: 156341, // your plan id
        customer: { email },
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/hustlekit?tab=tools`,
        payment_options: "card, banktransfer, ussd", // <-- here
      }),
    });

    const data = await res.json();
    console.log("FLW RAW:", data);

    if (data.status !== "success") {
      console.error("FLW ERROR:", data);
      return NextResponse.json(
        { error: data.message || "Could not start payment" },
        { status: 400 }
      );
    }

    return NextResponse.json({ link: data.data.link });
  } catch (e: any) {
    console.error("FLW SUB ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}