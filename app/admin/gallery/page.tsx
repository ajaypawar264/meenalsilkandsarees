"use client";

import { useEffect, useRef, useState } from "react";
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
import { uploadFileToImageKit } from "@/lib/imagekitUpload";

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
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // 🔥 IMAGEKIT UPLOAD
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const res = await uploadFileToImageKit(file);

      setPreviewUrl(res.url);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!previewUrl) {
      alert("Image/Video upload kar");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "gallery"), {
        title: title.trim(),
        type,
        url: previewUrl,
        createdAt: serverTimestamp(),
      });

      setTitle("");
      setPreviewUrl("");
      fetchGallery();
      alert("Gallery item add jhala ✅");
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
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex justify-between">
          <h1 className="text-3xl font-bold text-yellow-400">
            Gallery Management
          </h1>

          <div className="flex gap-3">
            <Link href="/admin/orders" className="text-cyan-400">
              Orders
            </Link>
            <Link href="/admin/products" className="text-yellow-400">
              Stock
            </Link>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-3">
          {/* FORM */}
          <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
            <h2 className="text-xl font-bold mb-4">Add Gallery</h2>

            <form onSubmit={handleAdd} className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-3 rounded bg-black border border-white/20"
              />

              <select
                value={type}
                onChange={(e) => setType(e.target.value as "image" | "video")}
                className="w-full p-3 rounded bg-black border border-white/20"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>

              {/* FILE UPLOAD */}
              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={openFilePicker}
                className="w-full p-3 bg-white/10 rounded"
              >
                Upload File
              </button>

              {uploading && <p>Uploading...</p>}

              {/* PREVIEW */}
              {previewUrl && (
                <div className="mt-3">
                  {type === "image" ? (
                    <img
                      src={previewUrl}
                      className="w-full h-40 object-cover rounded"
                    />
                  ) : (
                    <video src={previewUrl} controls className="w-full rounded" />
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 text-black p-3 rounded font-bold"
              >
                {loading ? "Adding..." : "Add Item"}
              </button>
            </form>
          </div>

          {/* LIST */}
          <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden border border-white/10 bg-white/5"
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    className="h-60 w-full object-cover"
                  />
                ) : (
                  <video src={item.url} controls className="h-60 w-full" />
                )}

                <div className="p-4">
                  <p className="font-semibold">{item.title || "Untitled"}</p>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="mt-3 bg-red-500 px-4 py-2 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}