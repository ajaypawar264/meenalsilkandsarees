"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "../components/Header";

type OfferItem = {
  id: string;
  type: "image" | "video";
  url: string;
};

export default function DailyOfferPage() {
  const [items, setItems] = useState<OfferItem[]>([]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const q = query(
          collection(db, "dailyOffers"), // 🔥 change here
          orderBy("createdAt", "desc")
        );

        const snap = await getDocs(q);

        const data: OfferItem[] = snap.docs.map((docItem) => ({
          id: docItem.id,
          ...(docItem.data() as Omit<OfferItem, "id">),
        }));

        setItems(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchOffers();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#12090f] to-[#1a0d10] text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <h1 className="mb-8 text-3xl font-bold text-[#f3c46b]">
          🎁 Daily Offers
        </h1>

        {items.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
            No offers available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="inline-block overflow-hidden rounded-3xl p-[1.5px] bg-gradient-to-r from-[#f3c46b] via-pink-500 to-[#f3c46b] shadow-xl"
              >
                <div className="flex justify-center bg-black/30 p-4">

                  {item.type === "image" ? (
                    <img
                      src={item.url}
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

                <div className="p-4 text-center">
                  <p className="font-semibold text-white">
                    Special Offer 🔥
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