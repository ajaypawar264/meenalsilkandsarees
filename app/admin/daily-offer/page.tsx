"use client";

import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DailyOfferPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!videoUrl) {
      alert("Video link paste kar");
      return;
    }

    try {
      setLoading(true);

      await setDoc(doc(db, "dailyOffer", "current"), {
        videoUrl,
        updatedAt: serverTimestamp(),
      });

      alert("Video link saved 🔥");
      setVideoUrl("");
    } catch (error) {
      console.log(error);
      alert("Error saving link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#12070b] px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
        <h1 className="mb-6 text-3xl font-bold text-[#f3c46b]">
          Daily Offer Video (Link)
        </h1>

        <input
          type="text"
          placeholder="Paste video link here..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="mb-4 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3"
        />

        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-[#b88639] to-[#e2b45b] px-6 py-3 font-semibold text-[#2b1208]"
        >
          {loading ? "Saving..." : "Save Video"}
        </button>
      </div>
    </main>
  );
}