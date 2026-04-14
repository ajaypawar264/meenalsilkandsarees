"use client";

import { useEffect, useRef, useState } from "react";
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

type OfferItem = {
  id: string;
  type: "image" | "video";
  url: string;
};

export default function AdminDailyOfferPage() {
  const [items, setItems] = useState<OfferItem[]>([]);
  const [type, setType] = useState<"image" | "video">("image");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 🔥 FETCH OFFERS
  const fetchOffers = async () => {
    try {
      const q = query(
        collection(db, "dailyOffers"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);

      const data: OfferItem[] = snap.docs.map((docItem) => ({
        id: docItem.id,
        ...(docItem.data() as Omit<OfferItem, "id">),
      }));

      setItems(data);
    } catch (err) {
      console.log(err);
      alert("Offers load zala nahi");
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // 🔥 IMAGEKIT UPLOAD
  const handleFileChange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const res = await uploadFileToImageKit(file);
      setPreviewUrl(res.url);
    } catch (err) {
      console.log(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // 🔥 ADD OFFER
  const handleAdd = async () => {
    if (!previewUrl) {
      alert("File upload kar bhai");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "dailyOffers"), {
        type,
        url: previewUrl,
        createdAt: serverTimestamp(),
      });

      setPreviewUrl("");
      fetchOffers();
      alert("Offer add jhala 🔥");
    } catch (err) {
      console.log(err);
      alert("Add failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 DELETE SINGLE
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "dailyOffers", id));
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.log(err);
      alert("Delete zala nahi");
    }
  };

  return (
    <main className="min-h-screen bg-[#12070b] text-white px-6 py-10">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-3xl font-bold text-[#f3c46b] mb-8">
          Daily Offer Management
        </h1>

        <div className="grid gap-8 md:grid-cols-3">

          {/* FORM */}
          <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
            <h2 className="mb-4 text-lg font-semibold">Add Offer</h2>

            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full mb-3 p-2 rounded bg-black border border-white/20"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>

            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <button
              onClick={openFilePicker}
              className="w-full bg-white/10 p-3 rounded"
            >
              Upload File
            </button>

            {uploading && <p className="mt-2 text-sm">Uploading...</p>}

            {/* PREVIEW */}
            {previewUrl && (
              <div className="mt-3">
                {type === "image" ? (
                  <img src={previewUrl} className="w-full h-40 object-cover rounded" />
                ) : (
                  <video src={previewUrl} controls className="w-full rounded" />
                )}
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={loading}
              className="mt-4 w-full bg-yellow-500 text-black p-3 rounded font-bold"
            >
              {loading ? "Adding..." : "Add Offer"}
            </button>
          </div>

          {/* LIST */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
              >
                {item.type === "image" ? (
                  <img src={item.url} className="h-60 w-full object-cover" />
                ) : (
                  <video src={item.url} controls className="h-60 w-full" />
                )}

                <div className="p-4">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="bg-red-500 px-4 py-2 rounded"
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