import { NextResponse } from "next/server";
import ImageKit from "imagekit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // ImageKit config
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    console.log("IMAGEKIT ENV CHECK:", {
      publicKey: !!publicKey,
      privateKey: !!privateKey,
      urlEndpoint: !!urlEndpoint,
    });

    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json(
        {
          success: false,
          message: "ImageKit environment variables are missing.",
        },
        { status: 500 }
      );
    }

    // IMPORTANT: ImageKit is created INSIDE POST
    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid file uploaded",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: file.name,
      folder: "/meenal-silk/products",
      useUniqueFileName: true,
    });

    console.log("IMAGEKIT UPLOAD SUCCESS:", uploadResponse.url);

    return NextResponse.json({
      success: true,
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      name: uploadResponse.name,
    });
  } catch (error) {
    console.error("IMAGEKIT UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "ImageKit upload failed",
      },
      { status: 500 }
    );
  }
}