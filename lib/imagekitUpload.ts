export type UploadedMediaItem = {
  url: string;
  type: "image" | "video";
};

export async function uploadFileToImageKit(
  file: File
): Promise<UploadedMediaItem> {
  const authRes = await fetch("/api/imagekit-auth");
  const authData = await authRes.json();

  if (!authRes.ok) {
    throw new Error(authData?.error || "ImageKit auth failed");
  }

  const { signature, expire, token, publicKey } = authData;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", `${Date.now()}-${file.name}`);
  formData.append("publicKey", publicKey);
  formData.append("signature", signature);
  formData.append("expire", String(expire));
  formData.append("token", token);
  formData.append("folder", "/products");

  const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: formData,
  });

  const uploadData = await uploadRes.json();

  if (!uploadRes.ok) {
    console.error("UPLOAD ERROR:", uploadData);
    throw new Error(uploadData?.message || "Upload failed");
  }

  const mimeType = file.type || "";
  const type: "image" | "video" = mimeType.startsWith("video/")
    ? "video"
    : "image";

  return {
    url: uploadData.url,
    type,
  };
}