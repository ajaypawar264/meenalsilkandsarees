"use client";

import { useEffect, useState } from "react";
import { getWishlist, removeFromWishlist } from "@/lib/wishlist";
import Header from "../components/Header";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart";
import Link from "next/link";

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const loadWishlist = () => {
      const data = getWishlist();

      console.log("Wishlist Data 👉", data);

      setItems(data);
    };

    loadWishlist();

    window.addEventListener("wishlistUpdated", loadWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", loadWishlist);
    };
  }, []);

  const getProductImage = (item: any) => {
    return (
      item.imageUrl ||
      item.imageUrls?.[0] ||
      item.mediaFiles?.find((m: any) => m.type === "image")?.url ||
      item.imageBase64 ||
      "/placeholder.png"
    );
  };

  const handleBuyNow = (item: any) => {
    addToCart({
      id: item.id,
      name: item.name || item.baseName || "Product",
      price: item.price || 0,
      category: item.category || "Uncategorized",
      imageUrl: getProductImage(item),
    });

    router.push("/cart");
  };

  const handleRemove = (id: string) => {
    removeFromWishlist(id);

    const updated = getWishlist();
    setItems(updated);

    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  return (
    <main className="min-h-screen bg-[#12070b] text-white">
      <Header />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-8 text-3xl font-bold text-[#f3c46b]">
          ❤️ Wishlist
        </h1>

        {items.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-white/70">
              No items in wishlist
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl bg-white/10 p-4"
              >
                {/* PRODUCT IMAGE */}
                <Link href={`/products/${item.id}`}>
                  <img
                    src={getProductImage(item)}
                    alt={item.name || "Product"}
                    className="h-40 w-full cursor-pointer rounded object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.png";
                    }}
                  />
                </Link>

                {/* PRODUCT NAME */}
                <Link href={`/products/${item.id}`}>
                  <h3 className="mt-3 cursor-pointer font-semibold hover:text-[#f3c46b]">
                    {item.name || item.baseName || "Product"}
                  </h3>
                </Link>

                {/* PRICE */}
                <p className="mt-1 text-lg font-semibold text-[#f3c46b]">
                  ₹{item.price || 0}
                </p>

                {/* BUY NOW */}
                <button
                  onClick={() => handleBuyNow(item)}
                  className="mt-3 w-full rounded bg-green-500 px-3 py-2 font-semibold text-white hover:bg-green-600"
                >
                  Buy Now ⚡
                </button>

                {/* REMOVE */}
                <button
                  onClick={() => handleRemove(item.id)}
                  className="mt-2 w-full rounded bg-red-500 px-3 py-2 font-semibold text-white hover:bg-red-600"
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