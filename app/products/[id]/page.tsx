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

type ColorVariant = {
  color: string;
  imageUrl: string;
  price?: number;
  stock?: number;
  mediaFiles?: ProductMediaItem[];
  description?: string;
};

type Product = {
  id: string;
  name: string;
  baseName?: string;
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
  colors?: ColorVariant[];
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const productId = useMemo(() => {
    const id = params?.id;
    return Array.isArray(id) ? id[0] : (id as string | undefined);
  }, [params]);

  const [selectedColor, setSelectedColor] =
    useState<ColorVariant | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!productId) {
          setLoading(false);
          return;
        }

        console.log("PRODUCT ID 👉", productId);

        const productRef = doc(db, "products", productId);
        const snap = await getDoc(productRef);

        if (!snap.exists()) {
          console.log("PRODUCT NOT FOUND 👉", productId);
          setProduct(null);
          return;
        }

        const data = snap.data() as any;

        // =====================================================
        // DESCRIPTION FIX
        // Admin मधून save केलेली description direct Firestore मधून
        // घेणार आहे.
        // =====================================================

        const firestoreDescription =
          typeof data.description === "string"
            ? data.description.trim()
            : "";

        // काही जुन्या products मध्ये description color variant मध्ये
        // असण्याची शक्यता म्हणून हा fallback.
        const variantDescription =
          Array.isArray(data.colors) && data.colors.length > 0
            ? typeof data.colors[0]?.description === "string"
              ? data.colors[0].description.trim()
              : ""
            : "";

        const finalDescription =
          firestoreDescription || variantDescription || "";

        console.log("FIRESTORE DESCRIPTION 👉", data.description);
        console.log("FINAL DESCRIPTION 👉", finalDescription);

        // =====================================================

        const colors: ColorVariant[] = Array.isArray(data.colors)
          ? data.colors.map((c: any) => ({
              color: c.color || "",
              imageUrl: c.imageUrl || data.imageUrl || "",
              price: Number(c.price ?? data.price ?? 0),
              stock: Number(c.stock ?? data.stock ?? 0),
              mediaFiles: Array.isArray(c.mediaFiles)
                ? c.mediaFiles
                : [],
              description:
                typeof c.description === "string"
                  ? c.description.trim()
                  : "",
            }))
          : data.color
          ? data.color.split("/").map((clr: string) => ({
              color: clr.trim(),
              imageUrl: data.imageUrl || "",
              price: Number(data.price ?? 0),
              stock: Number(data.stock ?? 0),
              mediaFiles: Array.isArray(data.mediaFiles)
                ? data.mediaFiles
                : [],
              description: "",
            }))
          : [];

        const productData: Product = {
          id: snap.id,

          name:
            data.name ||
            data.baseName ||
            "Unnamed Product",

          baseName: data.baseName || "",

          price: Number(data.price ?? 0),

          stock: Number(data.stock ?? 0),

          category:
            data.category || "Uncategorized",

          subCategory:
            data.subCategory || "",

          inStock:
            typeof data.inStock === "boolean"
              ? data.inStock
              : Number(data.stock ?? 0) > 0,

          imageUrl:
            data.imageUrl || "",

          imageUrls:
            Array.isArray(data.imageUrls)
              ? data.imageUrls
              : [],

          videoUrls:
            Array.isArray(data.videoUrls)
              ? data.videoUrls
              : [],

          mediaFiles:
            Array.isArray(data.mediaFiles)
              ? data.mediaFiles
              : [],

          // ⭐ IMPORTANT
          // Admin मध्ये manually save केलेली description इथे येईल.
          description: finalDescription,

          colors,
        };

        console.log("FULL PRODUCT 👉", productData);

        setProduct(productData);
      } catch (error) {
        console.error("Product fetch error:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  // =====================================================
  // DEFAULT COLOR
  // =====================================================

  useEffect(() => {
    if (product?.colors && product.colors.length > 0) {
      setSelectedColor(product.colors[0]);
    } else {
      setSelectedColor(null);
    }
  }, [product]);

  // =====================================================
  // SELECTED COLOR
  // =====================================================

  const selectedDescription = useMemo(() => {
    const variantDesc = selectedColor?.description?.trim();

    if (variantDesc) {
      return variantDesc;
    }

    const productDesc = product?.description?.trim();

    if (productDesc) {
      return productDesc;
    }

    return "";
  }, [product?.description, selectedColor]);

  // =====================================================
  // IMAGE
  // =====================================================

  const normalizedImageUrl = useMemo(() => {
    const firstImageFromMedia =
      product?.mediaFiles?.find(
        (item) => item.type === "image"
      )?.url || "";

    const firstImage =
      selectedColor?.imageUrl ||
      product?.imageUrl ||
      product?.imageUrls?.[0] ||
      firstImageFromMedia ||
      "";

    if (!firstImage) return "";

    return firstImage
      .replace(/\\/g, "/")
      .replace(/^public\//, "/")
      .replace(/^public/, "/");
  }, [product, selectedColor]);

  // =====================================================
  // OLD PRICE
  // =====================================================

  const fakeOldPrice = useMemo(() => {
    return Math.max(
      Math.round((product?.price || 0) * 1.45),
      product?.price || 0
    );
  }, [product?.price]);

  // =====================================================
  // DISCOUNT
  // =====================================================

  const discount = useMemo(() => {
    if (
      !product?.price ||
      !fakeOldPrice ||
      fakeOldPrice <= product.price
    ) {
      return 10;
    }

    return Math.max(
      10,
      Math.min(
        50,
        Math.round(
          ((fakeOldPrice - product.price) /
            fakeOldPrice) *
            100
        )
      )
    );
  }, [product?.price, fakeOldPrice]);

  // =====================================================
  // LOADING
  // =====================================================

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

  // =====================================================
  // PRODUCT NOT FOUND
  // =====================================================

  if (!product) {
    return (
      <main className="min-h-screen bg-[#12070b] text-white">
        <Header />

        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-red-400">
            Product not found
          </h1>

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

  // =====================================================
  // MAIN
  // =====================================================

  return (
    <main className="min-h-screen bg-[#12070b] text-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">

        {/* BACK */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
        >
          ← Back
        </button>

        <div className="grid gap-8 md:grid-cols-2">

          {/* =================================================
              IMAGE / VIDEO
          ================================================= */}

          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/10 shadow-xl">

            <ProductMediaSlider
              key={selectedColor?.color || "default"}
              productName={product.name || "product"}
              imageUrl={
                selectedColor?.imageUrl ||
                product.imageUrl ||
                ""
              }
              imageUrls={[]}
              videoUrls={[]}
              mediaFiles={
                selectedColor?.mediaFiles?.length
                  ? selectedColor.mediaFiles
                  : product.mediaFiles || []
              }
            />

          </div>

          {/* =================================================
              PRODUCT DETAILS
          ================================================= */}

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">

            {/* CATEGORY */}
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

            {/* PRODUCT NAME */}
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              {product.name || product.baseName}
            </h1>

            {/* PRICE */}
            <div className="mt-4 flex items-end gap-3">

              <p className="text-3xl font-bold text-[#ffd27a]">
                ₹
                {selectedColor?.price ||
                  product.price}
              </p>

              <p className="text-lg text-white/35 line-through">
                ₹{fakeOldPrice}
              </p>

              <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                {discount}% OFF
              </span>

            </div>

            {/* =================================================
                COLORS
            ================================================= */}

            {(product.colors?.length ?? 0) > 0 ? (
              <div className="mt-6">

                <h3 className="mb-2 text-sm font-semibold text-white/80">
                  Select Color ({product.colors?.length})
                </h3>

                <div className="flex flex-wrap gap-3">

                  {(product.colors || []).map(
                    (c: ColorVariant, i: number) => (
                      <button
                        type="button"
                        key={`${c.color}-${i}`}
                        title={c.color}
                        onClick={() =>
                          setSelectedColor(c)
                        }
                        className={`rounded-full border px-3 py-1 text-xs cursor-pointer ${
                          selectedColor?.color === c.color
                            ? "bg-white text-black"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {c.color}
                      </button>
                    )
                  )}

                </div>
              </div>
            ) : (
              <p className="mt-4 text-red-400">
                No colors available
              </p>
            )}

            {/* =================================================
                STOCK
            ================================================= */}

            <div className="mt-5">

              <p
                className={`text-sm font-medium ${
                  product.inStock
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {product.inStock
                  ? "In Stock"
                  : "Out of stock"}
              </p>

            </div>

            {/* =================================================
                DESCRIPTION - FIXED
            ================================================= */}

            <div className="mt-6 border-t border-white/10 pt-6">

              <h2 className="text-lg font-semibold text-white">
                Description
              </h2>

              <p className="mt-3 whitespace-pre-line leading-7 text-white/70">

                {selectedDescription ? (
                  selectedDescription
                ) : (
                  "Premium saree collection with elegant design, rich fabric and graceful look for every special occasion."
                )}

              </p>

            </div>

            {/* =================================================
                BUTTONS
            ================================================= */}

            <div className="mt-8 flex flex-wrap gap-4">

              {/* ADD TO CART */}

              <button
                type="button"
                onClick={() => {
                  addToCart({
                    id: product.id,
                    name:
                      product.name ||
                      product.baseName ||
                      "Unnamed Product",
                    price:
                      selectedColor?.price ||
                      product.price,
                    category:
                      product.category ||
                      "Uncategorized",
                    imageUrl:
                      normalizedImageUrl || "",
                  });

                  alert("Item added to cart ✅");
                }}
                disabled={!product.inStock}
                className="rounded-2xl bg-gradient-to-r from-[#b88639] to-[#e2b45b] px-6 py-3 font-semibold text-[#2b1208] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-white/70"
              >
                {product.inStock
                  ? "Add to Cart"
                  : "Sold Out"}
              </button>

              {/* VIEW CART */}

              <Link
                href="/cart"
                className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                View Cart
              </Link>

              {/* VIEW IMAGE */}

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