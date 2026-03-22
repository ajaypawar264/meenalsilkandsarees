"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "../components/Header";

type GalleryItem = {
  id: string;
  title?: string;
  type: "image" | "video";
  url: string;
};

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const data: GalleryItem[] = snap.docs.map((docItem) => ({
          id: docItem.id,
          ...(docItem.data() as Omit<GalleryItem, "id">),
        }));

        setItems(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchGallery();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#12090f] to-[#1a0d10] text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <h1 className="mb-8 text-3xl font-bold text-yellow-400">Gallery</h1>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            No gallery items found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="inline-block overflow-hidden rounded-3xl p-[1.5px] bg-gradient-to-r from-yellow-400 via-pink-500 to-yellow-400 shadow-xl"
              >
                <div className="flex justify-center bg-black/30 p-4">
  {item.type === "image" ? (
    <img
      src={item.url}
      alt={item.title || "Gallery image"}
      className="h-auto w-auto max-h-[520px] object-contain"
    />
  ) : (
    <video
      src={item.url}
      controls
      className="h-auto w-auto max-h-[520px] object-contain"
    />
  )}
  
</div>

                <div className="p-4">
                  <p className="font-semibold text-white">
                    {item.title || "Untitled"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}