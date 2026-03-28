"use client";

export const dynamic = "force-dynamic";

import ProductMediaSlider from "@/app/components/ProductMediaSlider";
import Reviews from "./components/Reviews";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addToCart } from "@/lib/cart";
import Header from "./components/Header";

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
  category: string;
  subCategory?: string;
  inStock: boolean;
  imageUrl?: string;
  imageBase64?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  mediaFiles?: ProductMediaItem[];
  createdAt?: {
    seconds?: number;
    nanoseconds?: number;
  };
};

type CategorySlide = {
  name: string;
  image: string;
};

const categoryOptions = ["Pure Silk Handloom", "Cotton", "Today Arrival"];

const subCategoryOptions: Record<string, string[]> = {
  "Pure Silk Handloom": [
    "Paithani",
    "Gadhwal",
    "Kanjivaram",
    "Dharamavaram",
    "Chanderi",
    "Narayanpet",
    "Maheshwari",
    "Irkal Temple Border",
  ],
  Cotton: ["Gadhwal Cotton", "Maheshwari Cotton", "Printed Cotton"],
  "Today Arrival": [
    "Paithani",
    "Gadhwal",
    "Kanjivaram",
    "Dharamavaram",
    "Chanderi",
    "Narayanpet",
    "Maheshwari",
    "Irkal Temple Border",
    "Gadhwal Cotton",
    "Maheshwari Cotton",
    "Printed Cotton",
  ],
};

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "");
    }

    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/shorts/")[1].split("/")[0];
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1].split("/")[0];
      }

      return parsed.searchParams.get("v") || "";
    }

    return "";
  } catch {
    return "";
  }
}

function getInstagramEmbedUrl(url: string) {
  const cleanUrl = url.split("?")[0];
  return cleanUrl.endsWith("/") ? `${cleanUrl}embed` : `${cleanUrl}/embed`;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [dailyOfferVideo, setDailyOfferVideo] = useState("");
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "products"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Product[] = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...(docItem.data() as Omit<Product, "id">),
        }));

        const sortedItems = items.sort((a, b) => {
          const aTime = a?.createdAt?.seconds ?? 0;
          const bTime = b?.createdAt?.seconds ?? 0;
          return bTime - aTime;
        });

        setProducts(sortedItems);
      },
      (error) => {
        console.error("Products fetch error:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "dailyOffer", "current"), (snap) => {
      if (snap.exists()) {
        setDailyOfferVideo(snap.data()?.videoUrl || "");
      } else {
        setDailyOfferVideo("");
      }
    });

    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => {
    const dbCategories = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ) as string[];

    const merged = Array.from(new Set([...categoryOptions, ...dbCategories]));
    return ["All", ...merged];
  }, [products]);

  const subCategories = useMemo(() => {
    if (selectedCategory === "All") return ["All"];

    const mapped = subCategoryOptions[selectedCategory] || [];
    const dbSubs = Array.from(
      new Set(
        products
          .filter((p) => (p.category || "") === selectedCategory)
          .map((p) => p.subCategory)
          .filter(Boolean)
      )
    ) as string[];

    return ["All", ...Array.from(new Set([...mapped, ...dbSubs]))];
  }, [products, selectedCategory]);

  const categorySlides = useMemo<CategorySlide[]>(() => {
    const uniqueCategories = categories.filter((cat) => cat !== "All");

    const slides = uniqueCategories.map((cat) => {
      const matchedProduct = products.find(
        (p) => (p.category || "") === cat && p.imageUrl
      );

      return {
        name: cat,
        image:
          matchedProduct?.imageUrl ||
          "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80",
      };
    });

    if (slides.length === 0) {
      return [
        {
          name: "Pure Silk Handloom",
          image:
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80",
        },
        {
          name: "Cotton",
          image:
            "https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=900&q=80",
        },
        {
          name: "Today Arrival",
          image:
            "https://images.unsplash.com/photo-1610189020377-2b3e9cfd5b59?auto=format&fit=crop&w=900&q=80",
        },
      ];
    }

    return slides;
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = (p.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || (p.category || "") === selectedCategory;

      const matchesSubCategory =
        selectedSubCategory === "All" ||
        (p.subCategory || "") === selectedSubCategory;

      return matchesSearch && matchesCategory && matchesSubCategory;
    });
  }, [products, search, selectedCategory, selectedSubCategory]);

  const featuredProducts = filteredProducts.slice(0, 8);

  const isYouTube =
    dailyOfferVideo.includes("youtube.com") ||
    dailyOfferVideo.includes("youtu.be");

  const isInstagram =
    dailyOfferVideo.includes("instagram.com/reel/") ||
    dailyOfferVideo.includes("instagram.com/p/");

  const isDirectVideo =
    dailyOfferVideo.endsWith(".mp4") ||
    dailyOfferVideo.endsWith(".webm") ||
    dailyOfferVideo.endsWith(".ogg");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#12070b] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,196,87,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(195,70,90,0.16),transparent_30%),radial-gradient(circle_at_bottom,rgba(255,160,122,0.10),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:70px_70px]" />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#c8873a]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-[#7a1930]/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-[#45205f]/20 blur-3xl" />

      <Header />

      <section className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <div className="flex flex-col md:flex-row">
              <input
                type="text"
                placeholder="Search for paithani, silk, wedding sarees..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent px-5 py-4 text-white outline-none placeholder:text-white/45"
              />
              <button
                type="button"
                className="bg-gradient-to-r from-[#b88639] via-[#d8a64f] to-[#b67b2d] px-6 py-4 font-semibold text-[#2b1208] transition hover:brightness-110"
              >
                Search
              </button>
            </div>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedSubCategory("All");
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                  selectedCategory === cat
                    ? "bg-gradient-to-r from-[#b88639] to-[#d8a64f] font-semibold text-[#2b1208]"
                    : "border border-white/10 bg-white/10 text-white/80 hover:bg-white/15"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {selectedCategory !== "All" && subCategories.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {subCategories.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubCategory(sub)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                    selectedSubCategory === sub
                      ? "bg-white font-semibold text-[#2b1208]"
                      : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative z-10 overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-10 md:grid-cols-2 md:px-6 md:py-16">
          <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#3b1020]/90 via-[#1f0d16]/90 to-[#12070b]/95 p-8 shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-10">
            <div className="mb-6">
              <div className="mb-6 flex items-center gap-4">
                <img
                  src="/logo3.png"
                  alt="Meenal Silk Logo"
                  className="h-15 w-15 rounded-xl bg-white/10 p-1 object-contain"
                />

                <div>
                  <p className="text-base font-extrabold uppercase tracking-[0.45em] text-[#f3c46b] md:text-lg">
                    MEENAL SILK
                  </p>
                  <p className="text-sm font-bold tracking-[0.35em] text-[#f3c46b] md:text-base">
                    AND SAREE
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5 h-[2px] w-28 bg-gradient-to-r from-[#f3c46b] to-transparent" />

            <h1 className="text-4xl font-bold leading-tight md:text-6xl">
              Royal Style in
              <span className="block bg-gradient-to-r from-[#f7d27c] via-[#ffd98f] to-[#d29a42] bg-clip-text text-transparent">
                Every Drape
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/75 md:text-base">
              Discover elegant paithani, silk, bridal and festive sarees crafted
              for timeless beauty. Premium collections for weddings, special
              occasions and graceful everyday style.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#products"
                className="rounded-xl bg-gradient-to-r from-[#b88639] to-[#e2b45b] px-6 py-3 font-semibold text-[#2b1208] transition hover:brightness-110"
              >
                Shop Now
              </a>

              <Link
                href="/cart"
                className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                View Cart
              </Link>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm">
                <p className="text-xl font-bold text-[#f3c46b]">100+</p>
                <p className="text-xs text-white/65">Designs</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm">
                <p className="text-xl font-bold text-[#f3c46b]">Premium</p>
                <p className="text-xs text-white/65">Quality</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur-sm">
                <p className="text-xl font-bold text-[#f3c46b]">Trusted</p>
                <p className="text-xs text-white/65">Store</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              {dailyOfferVideo ? (
                <div className="relative h-[420px] w-full bg-black/20">
                  {isYouTube ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeId(
                        dailyOfferVideo
                      )}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeId(
                        dailyOfferVideo
                      )}`}
                      className="h-[420px] w-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                    />
                  ) : isInstagram ? (
                    <iframe
                      src={getInstagramEmbedUrl(dailyOfferVideo)}
                      className="h-[420px] w-full"
                      allowFullScreen
                    />
                  ) : isDirectVideo ? (
                    <video
                      key={dailyOfferVideo}
                      className="h-[420px] w-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      preload="auto"
                    >
                      <source src={dailyOfferVideo} />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src="/hero-saree.jpg"
                      alt="Saree"
                      className="h-[420px] w-full object-cover transition duration-500 hover:scale-105"
                    />
                  )}

                  <div className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                    Daily Offer
                  </div>
                </div>
              ) : (
                <img
                  src="/hero-saree.jpg"
                  alt="Saree"
                  className="h-[420px] w-full object-cover transition duration-500 hover:scale-105"
                />
              )}
            </div>

            <div className="mt-10 overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <img
                src="/minal.jpeg"
                alt="Saree"
                className="h-[420px] w-full object-cover transition duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-3 md:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-xl">
          <p className="text-sm font-medium text-[#f3c46b]">Wedding Special</p>
          <h3 className="mt-2 text-2xl font-bold text-white">
            Bridal Collection
          </h3>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Royal sarees for wedding functions, engagement, haldi, reception and
            festive celebrations.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-xl">
          <p className="text-sm font-medium text-[#f3c46b]">Top Picks</p>
          <h3 className="mt-2 text-2xl font-bold text-white">Best Sellers</h3>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Customer favorite designs with premium fabric, rich colors and
            elegant finishing.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-xl">
          <p className="text-sm font-medium text-[#f3c46b]">Exclusive Range</p>
          <h3 className="mt-2 text-2xl font-bold text-white">Silk Collection</h3>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Premium silk sarees designed for timeless style, comfort and luxury.
          </p>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center justify-between">
          <div className="hidden flex-1 md:block" />

          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#f5cd7a] md:text-5xl">
              Categories
            </h2>
            <p className="mt-2 text-base text-white/60 md:text-lg">
              Explore our exquisite collection
            </p>
          </div>

          <div className="flex flex-1 justify-end">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedSubCategory("All");
              }}
              className="font-medium text-[#f5cd7a] transition hover:underline"
            >
              See more →
            </button>
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="category-marquee flex w-max gap-6">
            {[...categorySlides, ...categorySlides].map((cat, index) => (
              <button
                key={`${cat.name}-${index}`}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setSelectedSubCategory("All");
                }}
                className="w-[170px] shrink-0 text-center"
              >
                <div className="rounded-3xl border border-white/10 bg-white/10 p-3 shadow-lg transition hover:-translate-y-1 hover:bg-white/15 hover:shadow-2xl">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-[190px] w-full rounded-2xl object-cover"
                  />
                </div>
                <h4 className="mt-4 text-xl font-medium text-white/85">
                  {cat.name}
                </h4>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section
        id="products"
        className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:px-6"
      >
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1" />

          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#f5cd7a] md:text-5xl">
              Best Sellers
            </h2>
            <p className="mt-2 text-base text-white/60 md:text-lg">
              Our most loved products
            </p>
          </div>

          <div className="flex flex-1 justify-end">
            <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-[#f5cd7a] backdrop-blur">
              Selected: {selectedCategory}
              {selectedSubCategory !== "All" ? ` / ${selectedSubCategory}` : ""}
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-10 text-center text-white/65 shadow-lg backdrop-blur-xl">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
           {featuredProducts.map((p) => {
  const price = Number(p.price || 0);
  const fakeOldPrice = Math.round(price * 1.45 || 0);
  const discount =
    fakeOldPrice > 0
      ? Math.max(
          10,
          Math.min(
            50,
            Math.round(((fakeOldPrice - price) / fakeOldPrice) * 100)
          )
        )
      : 10;

  const normalizedImageUrl =
    p.imageUrl ||
    p.imageBase64 ||
    p.imageUrls?.[0] ||
    p.mediaFiles?.find((item) => item.type === "image")?.url ||
    "";

  return (
    <div
      key={p.id}
      className="group overflow-hidden rounded-[28px] border border-white/10 bg-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
    >
      <div className="relative z-0">
        <ProductMediaSlider
          productName={p.name}
          imageUrl={p.imageUrl}
          imageUrls={p.imageUrls || []}
          videoUrls={p.videoUrls || []}
          mediaFiles={p.mediaFiles || []}
        />
      </div>

      <div className="relative z-10 p-5">
        <h4 className="min-h-[64px] text-[20px] font-semibold leading-snug text-white">
          {p.name || "Untitled Product"}
        </h4>

        <div className="mt-3 flex items-end gap-3">
          <p className="text-2xl font-bold text-[#ffd27a]">
            ₹{price}
          </p>
          <p className="pb-1 text-base text-white/35 line-through">
            ₹{fakeOldPrice}
          </p>
        </div>

        <div className="mt-2">
          <span className="inline-flex rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-300">
            {discount}% OFF
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#f3c46b]/20 bg-[#f3c46b]/10 px-3 py-1 text-xs font-medium text-[#ffd98f]">
            {p.category || "General"}
          </span>

          {p.subCategory && (
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
              {p.subCategory}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span
            className={`text-sm font-medium ${
              p.inStock ? "text-green-400" : "text-red-400"
            }`}
          >
            {p.inStock ? `Stock: ${p.stock ?? 0}` : "Out of stock"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href={`/products/${p.id}`}
            className="rounded-full bg-white/90 px-5 py-3 text-center text-sm font-semibold text-[#1a1a1a] backdrop-blur-md transition hover:bg-white"
          >
            View
          </Link>

          <button
            type="button"
            onClick={() =>
              addToCart({
                id: p.id,
                name: p.name || "Products",
                price: price,
                category: p.category || "",
                imageUrl: normalizedImageUrl || "",
              })
            }
            disabled={!p.inStock}
            className="rounded-full bg-gradient-to-r from-[#d4a848] to-[#f2c76b] px-5 py-3 text-sm font-semibold text-[#2b1208] transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-white/70"
          >
            {p.inStock ? "Add to Cart" : "Sold Out"}
          </button>
        </div>
      </div>
    </div>
  );
})}
          </div>
        )}
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-6 px-4 pb-12 md:grid-cols-3 md:px-6">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-xl">
          <h4 className="text-xl font-bold text-white">Festival Collection</h4>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Elegant sarees for Diwali, traditional programs, family events and
            festive occasions.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-xl">
          <h4 className="text-xl font-bold text-white">Trusted Quality</h4>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Carefully selected fabrics, graceful colors and premium quality for
            a rich boutique experience.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg backdrop-blur-xl">
          <h4 className="text-xl font-bold text-white">Boutique Support</h4>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Browse, order, contact and explore collections easily from one place.
          </p>
        </div>
      </section>

      <Reviews />

     <footer className="relative z-10 border-t border-white/10 bg-black/25 backdrop-blur-xl">
  <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-sm">
          <img
            src="/logo2.png"
            alt="Meenal Silk Logo"
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        <div>
          <h5 className="text-xl font-bold text-[#f3c46b]">Meenal Silk</h5>
          <p className="text-sm text-white/55">and saree</p>
        </div>
      </div>

      <p className="text-sm leading-6 text-white/60">
        Elegant sarees for every occasion with premium quality, graceful
        style and timeless beauty.
      </p>
    </div>

    <div>
      <h6 className="mb-4 text-lg font-semibold text-white">Quick Links</h6>
      <div className="space-y-2 text-sm text-white/60">
        <p>
          <Link href="/" className="hover:text-[#f3c46b]">
            Home
          </Link>
        </p>
        <p>
          <Link href="/cart" className="hover:text-[#f3c46b]">
            Cart
          </Link>
        </p>
        <p>
          <Link href="/my-orders" className="hover:text-[#f3c46b]">
            My Orders
          </Link>
        </p>
        <p>
          <Link href="/login" className="hover:text-[#f3c46b]">
            Login
          </Link>
        </p>
      </div>
    </div>

    <div>
      <h6 className="mb-4 text-lg font-semibold text-white">Contact</h6>
      <div className="space-y-2 text-sm text-white/60">
        <p>Phone: +91 9518355820</p>
        <p>WhatsApp: +91 9561624194</p>
        <p>Email: meenalsilkstore@gmail.com</p>
      </div>

      <div className="mt-5">
        <h6 className="mb-3 text-lg font-semibold text-white">Follow Us</h6>
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href="https://www.facebook.com/share/18RMrXwGUX/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white/70 transition hover:text-[#f3c46b]"
          >
            Facebook
          </a>

          <a
            href="https://www.instagram.com/meenal__silkandsarees?igsh=NnBlNTkxdG5qZmtm/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white/70 transition hover:text-[#f3c46b]"
          >
            Instagram
          </a>

          <a
            href="https://youtube.com/@meenal_silkandsarees?si=bRFkSV9SwD_Bze1j/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-white/70 transition hover:text-[#f3c46b]"
          >
            YouTube
          </a>

          <a
            href="https://wa.me/919561624194"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-green-300 transition hover:bg-green-500/20"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>

    <div>
      <h6 className="mb-4 text-lg font-semibold text-white">Location</h6>
      <div className="space-y-2 text-sm text-white/60">
        <p>Meenal Silk and saree</p>
        <p>
          Shop no 15/16 Vanashree Palace Tapodham corner near Ambedkar Chowk
          Warje Pune 411058
        </p>
        <p>India</p>
        <a
          href="https://maps.app.goo.gl/5FSvitdkK3sbzhdn9"
          target="_blank"
          rel="noreferrer"
          className="inline-block text-[#f3c46b] hover:underline"
        >
          View on Google Maps
        </a>
      </div>
    </div>
  </div>

  <div className="border-t border-white/10">
    <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-sm text-white/50 md:flex-row md:items-center md:justify-between md:px-6">
      <p>© 2026 Meenal Silk and Saree. All rights reserved.</p>
      <p>Designed for premium saree shopping experience.</p>
    </div>
  </div>

  <a
    href="https://wa.me/9518355820"
    target="_blank"
    rel="noreferrer"
    className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-green-600"
  >
    <span>WhatsApp</span>
  </a>
</footer>

      <style jsx>{`
        .category-marquee {
          animation: categoryScroll 28s linear infinite;
        }

        .category-marquee:hover {
          animation-play-state: paused;
        }

        @keyframes categoryScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </main>
  );
}
