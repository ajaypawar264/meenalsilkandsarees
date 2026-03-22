"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type GalleryItem = {
  id: string;
  title?: string;
  type: "image" | "video";
  url: string;
};

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"image" | "video">("image");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

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
      alert("Gallery load zali nahi");
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      alert("URL tak");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "gallery"), {
        title: title.trim(),
        type,
        url: url.trim(),
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setType("image");
      setUrl("");
      fetchGallery();
      alert("Gallery item add jhala");
    } catch (error) {
      console.error(error);
      alert("Gallery item add zala nahi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "gallery", id));
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert("Delete zala nahi");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#12090f] to-[#1a0d10] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-400">
              Admin
            </p>
            <h1 className="text-3xl font-bold">Gallery Management</h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/orders"
              className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-cyan-300"
            >
              Orders
            </Link>
            <Link
              href="/admin/products"
              className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-yellow-300"
            >
              Stock
            </Link>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl xl:col-span-1">
            <h2 className="text-2xl font-bold text-yellow-400">Add Gallery Item</h2>

            <form onSubmit={handleAdd} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                  placeholder="Bridal Video"
                />
              </div>

              <div>
                <label className="mb-2 block">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "image" | "video")}
                  className="w-full rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block">URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/20 bg-black px-4 py-3 text-white"
                  placeholder="https://..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-yellow-500 py-3 font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add Item"}
              </button>
            </form>
          </div>

          <div className="xl:col-span-2">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl"
                >
                  {item.type === "image" ? (
                    <img
                      src={item.url}
                      alt={item.title || "Gallery image"}
                      className="h-[320px] w-full object-cover"
                    />
                  ) : (
                    <video
                      src={item.url}
                      controls
                      className="h-[320px] w-full object-cover"
                    />
                  )}

                  <div className="p-4">
                    <p className="font-semibold text-white">
                      {item.title || "Untitled"}
                    </p>
                    <p className="mt-1 text-sm text-white/60">{item.type}</p>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="mt-4 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {items.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
                No gallery items found
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}