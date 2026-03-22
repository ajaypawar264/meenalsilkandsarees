import { NextResponse } from "next/server";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const mobile = String(body.mobile || "").trim();
    const password = String(body.password || "").trim();

    if (!mobile || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile and password are required",
        },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 10-digit mobile number",
        },
        { status: 400 }
      );
    }

    const usersRef = collection(db, "users");

    const q = query(usersRef, where("mobile", "==", mobile), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid mobile number or password",
        },
        { status: 401 }
      );
    }

    const matchedDoc = snapshot.docs[0];
    const userData = matchedDoc.data();

    const dbPassword = String(userData.password || "").trim();

    if (dbPassword !== password) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid mobile number or password",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        user: {
          id: matchedDoc.id,
          name: String(userData.name || ""),
          mobile: String(userData.mobile || ""),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("LOGIN API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Login API failed",
      },
      { status: 500 }
    );
  }
}