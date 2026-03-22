import { NextResponse } from "next/server";
import { addDoc, collection, getDocs } from "firebase/firestore";
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

    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const alreadyExists = snapshot.docs.some((doc) => {
      const data = doc.data();
      return String(data.mobile || "").trim() === mobile;
    });

    if (alreadyExists) {
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
      createdAt: Date.now(),
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