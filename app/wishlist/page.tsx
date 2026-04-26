"use client";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { getWishlist, removeFromWishlist } from "@/lib/wishlist";
import Header from "../components/Header";
import {  query } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import Link from "next/link";

export default function WishlistPage() {
  const router = useRouter();
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
}, []);const handleBuyNow = (item: any) => {
  addToCart({
    id: item.id,
    name: item.name || item.baseName || "Product",
    price: item.price || 0,
    category: item.category || "Uncategorized",
    imageUrl: item.imageUrl || "",
  });

  router.push("/cart");
};


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
    {/* 🔥 CLICK IMAGE → PRODUCT PAGE */}
    <Link href={`/products/${item.id}`}>
      <img
        src={item.imageUrl || "/placeholder.png"}
        className="h-40 w-full object-cover rounded cursor-pointer"
      />
    </Link>

    {/* 🔥 CLICK NAME → PRODUCT PAGE */}
    <Link href={`/products/${item.id}`}>
      <h3 className="mt-2 cursor-pointer hover:text-[#f3c46b]">
        {item.name || item.baseName || "Product"}
      </h3>
    </Link>

    <p>₹{item.price}</p>

    {/* 🔥 BUY NOW BUTTON */}
    <button
      onClick={() => handleBuyNow(item)}
      className="mt-2 w-full bg-green-500 px-3 py-2 rounded font-semibold"
    >
      Buy Now ⚡
    </button>

    {/* ❌ REMOVE BUTTON */}
    <button
      onClick={() => {
        removeFromWishlist(item.id);
        setItems(getWishlist());
      }}
      className="mt-2 w-full bg-red-500 px-3 py-1 rounded"
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
