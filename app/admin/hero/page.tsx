"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { uploadFileToImageKit } from "@/lib/imagekitUpload";

type MediaItem = {
  url: string;
  type: "image" | "video";
};

export default function AdminHeroPage() {
  const [media1, setMedia1] = useState<MediaItem | null>(null);
  const [media2, setMedia2] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setFn: any,
    otherMedia: MediaItem | null
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video");

    // ❌ Rule: only 1 video allowed
    if (isVideo && otherMedia?.type === "video") {
      alert("Fakt 1 video allowed ahe bhai 😅 dusra image thev");
      return;
    }

    try {
      const uploaded = await uploadFileToImageKit(file);

      setFn({
        url: uploaded.url,
        type: isVideo ? "video" : "image",
      });
    } catch (err) {
      console.error(err);
      alert("Upload fail jhala");
    }
  };

  const handleSave = async () => {
    if (!media1 || !media2) {
      alert("Donhi slots fill kara");
      return;
    }

    try {
      setLoading(true);

      await setDoc(doc(db, "heroSection", "main"), {
        items: [media1, media2],
      });

      alert("🔥 Hero section updated successfully");
    } catch (err) {
      console.error(err);
      alert("Error zala");
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = (media: MediaItem | null) => {
    if (!media) return null;

    if (media.type === "video") {
      return (
        <video
          src={media.url}
          className="h-40 w-full object-cover rounded-xl"
          autoPlay
          muted
          loop
        />
      );
    }

    return (
      <img
        src={media.url}
        className="h-40 w-full object-cover rounded-xl"
      />
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#14080f] to-[#1a0d10] p-10 text-white">
      <h1 className="text-4xl font-bold mb-8 text-yellow-400">
        Hero Section Control
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* SLOT 1 */}
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <p className="mb-2 text-lg">Slot 1</p>
          <input
            type="file"
            onChange={(e) => handleUpload(e, setMedia1, media2)}
          />
          <div className="mt-4">{renderPreview(media1)}</div>
        </div>

        {/* SLOT 2 */}
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <p className="mb-2 text-lg">Slot 2</p>
          <input
            type="file"
            onChange={(e) => handleUpload(e, setMedia2, media1)}
          />
          <div className="mt-4">{renderPreview(media2)}</div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="mt-10 bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-4 rounded-xl font-bold text-black hover:scale-105 transition"
      >
        {loading ? "Saving..." : "Save Hero Section 🚀"}
      </button>
    </main>
  );
}