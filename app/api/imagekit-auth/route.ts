import { NextResponse } from "next/server";
import ImageKit from "imagekit";

// 🔹 GET → auth params
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

// 🔥 POST → file upload
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const imagekit = new ImageKit({
      publicKey: "public_y//9A+Zokt7RiIMVeN5Tfnk00DA=",
      privateKey: "private_hoNSFUb9SyXk7mOPNfrGkp03uL0=",
      urlEndpoint: "https://ik.imagekit.io/cilqld8nz",
    });

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: file.name,
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.url,
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Upload failed" },
      { status: 500 }
    );
  }
}