"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "../components/Header";

export default function ReviewsPage() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!name.trim() || !text.trim()) {
      setMessage("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "reviews"), {
        name: name.trim(),
        rating,
        text: text.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setName("");
      setRating(5);
      setText("");
      setMessage("Review submitted successfully. It will appear after approval ✅");
    } catch (error) {
      console.error(error);
      setMessage("Review submit failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#12070b] text-white">
      <Header />

      <section className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 shadow-xl backdrop-blur-xl">
          <h1 className="text-3xl font-bold text-[#f5cd7a]">Write a Review</h1>
          <p className="mt-2 text-white/60">
            Share your shopping experience with us
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-white/70">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#f3c46b]"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Rating</label>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#f3c46b]"
              >
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">Review</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-[#f3c46b]"
                placeholder="Write your review"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-[#b88639] to-[#e2b45b] px-6 py-3 font-semibold text-[#2b1208] transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>

            {message && (
              <p className="text-sm text-white/80">{message}</p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}