import { NextResponse } from "next/server";
import { addDoc, collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    const mobile = String(body.mobile || "").trim();
    const password = String(body.password || "").trim();
    const personalKey = String(body.personalKey || "").trim();

    if (!name || !mobile || !password || !personalKey) {
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

    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 6 characters",
        },
        { status: 400 }
      );
    }

    if (personalKey.length < 4) {
      return NextResponse.json(
        {
          success: false,
          message: "Personal key must be at least 4 characters",
        },
        { status: 400 }
      );
    }

    const usersRef = collection(db, "users");

    const existingUserQuery = query(
      usersRef,
      where("mobile", "==", mobile),
      limit(1)
    );

    const existingUserSnapshot = await getDocs(existingUserQuery);

    if (!existingUserSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          message: "Mobile number already registered",
        },
        { status: 409 }
      );
    }

    const docRef = await addDoc(usersRef, {
      name,
      mobile,
      password,
      personalKey,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: docRef.id,
          name,
          mobile,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Register API failed",
      },
      { status: 500 }
    );
  }
}