"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: any;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Review[] = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...(docItem.data() as Omit<Review, "id">),
      }));
      setReviews(items);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (
    id: string,
    status: "pending" | "approved" | "rejected"
  ) => {
    try {
      await updateDoc(doc(db, "reviews", id), { status });
    } catch (error) {
      console.error(error);
      alert("Status update failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "reviews", id));
    } catch (error) {
      console.error(error);
      alert("Delete failed");
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
            <h1 className="text-3xl font-bold">Review Management</h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin"
              className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-cyan-300"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/products"
              className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-yellow-300"
            >
              Stock
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#f5cd7a]">
                    {review.name}
                  </h2>
                  <p className="mt-2 text-sm text-white/70">
                    Rating: {"★".repeat(review.rating)}
                  </p>
                  <p className="mt-3 text-white/75">{review.text}</p>
                  <p className="mt-3 text-xs text-white/50">
                    Status: {review.status}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateStatus(review.id, "approved")}
                    className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(review.id, "rejected")}
                    className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => updateStatus(review.id, "pending")}
                    className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-medium text-black"
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}

          {reviews.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-6 text-white/70">
              No reviews found
            </div>
          )}
        </div>
      </div>
    </main>
  );
}