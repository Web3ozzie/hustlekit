import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email } = body;

    if (!userId || !email) {
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
        customer: { email },
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/hustlekit?tab=tools`,
        payment_options: "card,banktransfer,ussd,banktransfer_ng,account",
      }),
    });

    const data = await res.json();

    if (data.status !== "success" || !data.data?.link) {
      return NextResponse.json(
        { error: data.message || "Could not start payment" },
        { status: 400 }
      );
    }

    const paymentLink = data.data.link as string;
    return NextResponse.json({ link: paymentLink });
  } catch (e: any) {
    console.error("SUBSCRIBE-TOOLS ERROR:", e);
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}