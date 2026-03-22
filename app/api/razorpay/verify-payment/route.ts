import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const razorpay_order_id = String(body.razorpay_order_id || "").trim();
    const razorpay_payment_id = String(body.razorpay_payment_id || "").trim();
    const razorpay_signature = String(body.razorpay_signature || "").trim();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing payment verification fields",
        },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay secret is missing",
        },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment signature",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Payment verified successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("RAZORPAY VERIFY ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Payment verification failed",
      },
      { status: 500 }
    );
  }
}