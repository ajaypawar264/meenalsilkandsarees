import { NextResponse } from "next/server";
import ImageKit from "imagekit";

export async function GET() {
  try {
    const imagekit = new ImageKit({
      publicKey: "public_y//9A+Zokt7RiIMVeN5Tfnk00DA=",
      privateKey: "private_hoNSFUb9SyXk7mOPNfrGkp03uL0=",
      urlEndpoint: "https://ik.imagekit.io/cilqld8nz",
    });

    const authParams = imagekit.getAuthenticationParameters();

    return NextResponse.json({
      ...authParams,
      publicKey: "public_y//9A+Zokt7RiIMVeN5Tfnk00DA=",
    });
  } catch (error) {
    console.error("ImageKit auth route error:", error);
    return NextResponse.json(
      { error: "Failed to generate ImageKit auth params" },
      { status: 500 }
    );
  }
}