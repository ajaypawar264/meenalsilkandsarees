"use client";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { getWishlist, removeFromWishlist } from "@/lib/wishlist";
import Header from "../components/Header";
import {  query } from "firebase/firestore";



export default function WishlistPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
const [wishlistIds, setWishlistIds] = useState<string[]>([]);
useEffect(() => {
  const stored = localStorage.getItem("wishlist");
  setWishlistIds(stored ? JSON.parse(stored) : []);
}, []);
useEffect(() => {
  const fetchWishlistProducts = async () => {
    const saved = localStorage.getItem("wishlist");
    const ids = saved ? JSON.parse(saved) : [];

    if (ids.length === 0) {
      setProducts([]);
      return;
    }

    const q = query(collection(db, "products"));
    const snapshot = await getDocs(q);

    const allProducts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const filtered = allProducts.filter(p => ids.includes(p.id));

    setProducts(filtered);
  };

  fetchWishlistProducts();
}, []);


useEffect(() => {
  const data = getWishlist();
  console.log("Wishlist Data:", data); // 🔥 हे add कर
  setItems(data);
}, []);
  useEffect(() => {
    setItems(getWishlist());
  }, []);
  useEffect(() => {
  const data = getWishlist();
  console.log("Wishlist Data 👉", data);
  setItems(data);
}, []);

 return (
  <main className="min-h-screen bg-[#12070b] text-white">
    <Header />

    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-[#f3c46b] mb-8">
        ❤️ Wishlist
      </h1>

      {items.length === 0 ? (
        <p>No items in wishlist</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          {/* 🔥 THIS IS WHERE MAP GOES */}
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white/10 p-4 rounded-xl"
            >
              <img
                src={item.imageUrl || "/placeholder.png"}
                className="h-40 w-full object-cover rounded"
              />

              <h3 className="mt-2">{item.name}</h3>
              <p>₹{item.price}</p>

              <button
                onClick={() => {
                  removeFromWishlist(item.id);
                  setItems(getWishlist());
                }}
                className="mt-2 bg-red-500 px-3 py-1 rounded"
              >
                Remove
              </button>
            </div>
          ))}

        </div>
      )}
    </div>
  </main>
);
}
