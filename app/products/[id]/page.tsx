"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addToCart } from "@/lib/cart";
import Header from "@/app/components/Header";
import ProductMediaSlider from "@/app/components/ProductMediaSlider";

type ProductMediaItem = {
  url: string;
  type: "image" | "video";
  fileType?: string;
  thumbnailUrl?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  stock?: number;
  category?: string;
  subCategory?: string;
  inStock?: boolean;
  imageUrl?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  mediaFiles?: ProductMediaItem[];
  description?: string;
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const productId = useMemo(() => {
    const id = params?.id;
    return Array.isArray(id) ? id[0] : (id as string | undefined);
  }, [params]);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!productId) {
          setLoading(false);
          return;
        }

        const productRef = doc(db, "products", productId);
        const snap = await getDoc(productRef);

        if (!snap.exists()) {
          setProduct(null);
          return;
        }

        const data = snap.data() as Omit<Product, "id">;

        setProduct({
          id: snap.id,
          name: data.name || "Unnamed Product",
          price: Number(data.price ?? 0),
          stock: Number(data.stock ?? 0),
          category: data.category || "Uncategorized",
          subCategory: data.subCategory || "",
          inStock: Boolean(data.inStock ?? (Number(data.stock ?? 0) > 0)),
          imageUrl: data.imageUrl || "",
          imageUrls: data.imageUrls || [],
          videoUrls: data.videoUrls || [],
          mediaFiles: data.mediaFiles || [],
          description: data.description || "",
        });
      } catch (error) {
        console.error("Product fetch error:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const normalizedImageUrl = useMemo(() => {
    const firstImageFromMedia =
      product?.mediaFiles?.find((item) => item.type === "image")?.url || "";

    const firstImage =
      product?.imageUrl ||
      product?.imageUrls?.[0] ||
      firstImageFromMedia ||
      "";

    if (!firstImage) return "";

    return firstImage
      .replace(/\\/g, "/")
      .replace(/^public\//, "/")
      .replace(/^public/, "/");
  }, [product]);

  const fakeOldPrice = useMemo(() => {
    return Math.max(Math.round((product?.price || 0) * 1.45), product?.price || 0);
  }, [product?.price]);

  const discount = useMemo(() => {
    if (!product?.price || !fakeOldPrice || fakeOldPrice <= product.price) return 10;
    return Math.max(
      10,
      Math.min(
        50,
        Math.round(((fakeOldPrice - product.price) / fakeOldPrice) * 100)
      )
    );
  }, [product?.price, fakeOldPrice]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#12070b] text-white">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          Loading product...
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#12070b] text-white">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-red-400">Product not found</h1>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-[#b88639] to-[#e2b45b] px-6 py-3 font-semibold text-[#2b1208]"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#12070b] text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
        >
          ← Back
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/10 shadow-xl">
            <ProductMediaSlider
              productName={product.name}
              imageUrl={product.imageUrl}
              imageUrls={product.imageUrls || []}
              videoUrls={product.videoUrls || []}
              mediaFiles={product.mediaFiles || []}
            />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-[#f3c46b]/20 bg-[#f3c46b]/10 px-3 py-1 text-xs font-medium text-[#ffd98f]">
                {product.category || "Uncategorized"}
              </span>

              {product.subCategory ? (
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                  {product.subCategory}
                </span>
              ) : null}
            </div>

            <h1 className="text-3xl font-bold text-white md:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex items-end gap-3">
              <p className="text-3xl font-bold text-[#ffd27a]">
                ₹{product.price}
              </p>
              <p className="text-lg text-white/35 line-through">
                ₹{fakeOldPrice}
              </p>
              <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                {discount}% OFF
              </span>
            </div>

            <div className="mt-5">
              <p
                className={`text-sm font-medium ${
                  product.inStock ? "text-green-400" : "text-red-400"
                }`}
              >
                {product.inStock
                  ? `In Stock (${product.stock ?? 0})`
                  : "Out of stock"}
              </p>
            </div>

            <div className="mt-6 border-t border-white/10 pt-6">
              <h2 className="text-lg font-semibold text-white">Description</h2>
              <p className="mt-3 leading-7 text-white/70">
                {product.description ||
                  "Premium saree collection with elegant design, rich fabric and graceful look for every special occasion."}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() =>
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    category: product.category || "Uncategorized",
                    imageUrl: normalizedImageUrl || "",
                  })
                }
                disabled={!product.inStock}
                className="rounded-2xl bg-gradient-to-r from-[#b88639] to-[#e2b45b] px-6 py-3 font-semibold text-[#2b1208] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-white/70"
              >
                {product.inStock ? "Add to Cart" : "Sold Out"}
              </button>

              <Link
                href="/cart"
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                View Cart
              </Link>

              {normalizedImageUrl ? (
                <a
                  href={normalizedImageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  View First Image
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}