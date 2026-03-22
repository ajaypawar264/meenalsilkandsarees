"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: any;
};

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1 text-[#f3c46b]">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < count ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

function formatDate(value: any) {
  try {
    const date =
      typeof value?.toDate === "function"
        ? value.toDate()
        : value
        ? new Date(value)
        : null;

    if (!date || isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Review[] = snapshot.docs
          .map((docItem) => ({
            id: docItem.id,
            ...(docItem.data() as Omit<Review, "id">),
          }))
          .filter((item) => item.status === "approved");

        setReviews(items.slice(0, 6));
      },
      (error) => {
        console.error("Reviews fetch error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-[#f5cd7a] md:text-5xl">
          Customer Reviews
        </h2>
        <p className="mt-2 text-white/60">
          What our customers say about us
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center text-white/70 shadow-lg backdrop-blur-xl">
          No reviews yet.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/15"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3c46b] font-bold text-black">
                  {r.name?.charAt(0)?.toUpperCase() || "U"}
                </div>

                <div>
                  <p className="font-semibold text-white">{r.name}</p>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Stars count={r.rating} />
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm leading-6 text-white/75">“{r.text}”</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/reviews"
          className="rounded-2xl bg-gradient-to-r from-[#b88639] to-[#e2b45b] px-6 py-3 font-semibold text-[#2b1208] transition hover:brightness-110"
        >
          Write a Review →
        </Link>
      </div>
    </section>
  );
}