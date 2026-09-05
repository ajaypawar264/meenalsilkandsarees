import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const mobile = String(body.mobile || "").trim();
    const personalKey = String(body.personalKey || "").trim();
    const newPassword = String(body.newPassword || "").trim();

    if (!mobile || !personalKey || !newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
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

    if (newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    const usersRef = collection(db, "users");

    const userQuery = query(
      usersRef,
      where("mobile", "==", mobile),
      limit(1)
    );

    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile number not registered",
        },
        { status: 404 }
      );
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    if (String(userData.personalKey || "").trim() !== personalKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid Personal Key",
        },
        { status: 401 }
      );
    }

    await updateDoc(userDoc.ref, {
      password: newPassword,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("FORGOT PASSWORD API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Password reset failed",
      },
      { status: 500 }
    );
  }
}