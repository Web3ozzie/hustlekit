import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const secretHash = process.env.FLW_WEBHOOK_HASH;
  const signature = req.headers.get("verif-hash");

  if (!secretHash || !signature || signature !== secretHash) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const payload = await req.json();

  // Example: handle successful charge for your tools plan
  if (
    payload?.event === "charge.completed" &&
    payload?.data?.status === "successful"
  ) {
    const txRef = payload.data.tx_ref as string | undefined;

    // You set tx_ref = tools-${userId}-${timestamp} when you created the payment
    if (txRef && txRef.startsWith("tools-")) {
      const userId = txRef.split("-")[1];

      // TODO: update your DB: mark userId.hasToolsSub = true
      // e.g. await db.user.update({ where: { id: userId }, data: { hasToolsSub: true } });
    }
  }

  return NextResponse.json({ received: true });
}