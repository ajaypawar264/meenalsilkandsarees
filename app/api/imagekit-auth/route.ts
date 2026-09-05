import { NextResponse } from "next/server";
import ImageKit from "imagekit";

export const runtime = "nodejs";

function getImageKit() {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey) {
    throw new Error("IMAGEKIT_PUBLIC_KEY is missing");
  }

  if (!privateKey) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is missing");
  }

  if (!urlEndpoint) {
    throw new Error("IMAGEKIT_URL_ENDPOINT is missing");
  }

  return new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });
}

// GET → ImageKit authentication parameters
export async function GET() {
  try {
<<<<<<< HEAD
    const imagekit = new ImageKit({
      publicKey: "public_AmeYFtR722t2kivuv4wPyamuKoU=",
      privateKey: "private_FOwZB0U8CfE+dCMjalQFVCrj/wo=",
      urlEndpoint: "https://ik.imagekit.io/q76fdki6i",
    });
=======
    const imagekit = getImageKit();
>>>>>>> 580f1ff (Update ecommerce website and checkout)

    const authParams = imagekit.getAuthenticationParameters();

    return NextResponse.json({
      ...authParams,
<<<<<<< HEAD
      publicKey: "public_AmeYFtR722t2kivuv4wPyamuKoU=",
=======
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
>>>>>>> 580f1ff (Update ecommerce website and checkout)
    });
  } catch (error) {
    console.error("IMAGEKIT AUTH ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "ImageKit authentication failed",
      },
      { status: 500 }
    );
  }
}

// POST → Upload file to ImageKit
export async function POST(req: Request) {
  try {
    const imagekit = getImageKit();

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

<<<<<<< HEAD
    const imagekit = new ImageKit({
      publicKey: "public_AmeYFtR722t2kivuv4wPyamuKoU=",
      privateKey: "private_FOwZB0U8CfE+dCMjalQFVCrj/wo=",
      urlEndpoint: "https://ik.imagekit.io/q76fdki6i",
    });

=======
>>>>>>> 580f1ff (Update ecommerce website and checkout)
    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: file.name,
      folder: "/meenal-silk/products",
      useUniqueFileName: true,
    });

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