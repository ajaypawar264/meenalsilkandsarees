"use client";

export const dynamic = "force-dynamic";
import ProductMediaSlider from "@/app/components/ProductMediaSlider";
import { addToWishlist, removeFromWishlist } from "@/lib/wishlist";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "../components/Header";
import { addToCart } from "@/lib/cart";
import { Heart, ShoppingCart, Zap, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProductsPage() {
  const [wishlist, setWishlist] = useState<string[]>([]);

  

useEffect(() => {
  const update = () => {
    const stored = localStorage.getItem("wishlist");
    setWishlist(stored ? JSON.parse(stored) : []);
  };

  update();

  window.addEventListener("wishlistUpdated", update);

  return () => {
    window.removeEventListener("wishlistUpdated", update);
  };
}, []);


type Product = {
  id: string;
  name: string;
  price: number;
  stock?: number;
  color?: string;
  category?: string;
  inStock?: boolean;
  imageUrl?: string;
   imageUrls?: string[];
  videoUrls?: string[];
  mediaFiles?: any[];
};

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("50000");
  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(50000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<"all" | "inStock" | "outOfStock">("all");
  
  const toggleWishlist = (product: Product) => {
  const stored = localStorage.getItem("wishlist");
  let wishlist = stored ? JSON.parse(stored) : [];

  const exists = wishlist.find((item: any) => item.id === product.id);

  if (exists) {
    wishlist = wishlist.filter((item: any) => item.id !== product.id);
  } else {
    wishlist.push({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl:
        product.imageUrl ||
        product.imageUrls?.[0] ||
        product.mediaFiles?.find((m) => m.type === "image")?.url ||
        "",
    });
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));

  // 🔥 update state
  setWishlist(wishlist.map((item: any) => item.id));

  // 🔥 header update event
  window.dispatchEvent(new Event("wishlistUpdated"));
};

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

       const items: Product[] = snapshot.docs.map((docItem) => {
  const data = docItem.data() as any;

  const stockValue = Number(data.stock ?? 0);
  const priceValue = Number(data.price ?? 0);

  const mainImage =
    data.colors?.[0]?.imageUrl || "";

  return {
    id: docItem.id,
    name: data.name || "Unnamed Product",
    color: data.color || "",
    price: Number.isFinite(priceValue) ? priceValue : 0,
    stock: Number.isFinite(stockValue) ? stockValue : 0,
    category: data.category || "Uncategorized",
    inStock:
      typeof data.inStock === "boolean"
        ? data.inStock
        : stockValue > 0,

    // 🔥 IMAGE FIX HERE
    imageUrl: mainImage,

    imageUrls: data.imageUrls || [],
    videoUrls: data.videoUrls || [],
    mediaFiles: data.mediaFiles || [],
  };
});

        setProducts(items);
      } catch (error) {
        console.error("Products fetch error:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) {
      setSelectedCategories([categoryFromUrl]);
    }
  }, [searchParams]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map((p) => p.category || "Uncategorized").filter(Boolean))
    );
  }, [products]);

 const filteredProducts = useMemo(() => {
  return products.filter((p) => {
    const productName = (p.name || "").toLowerCase();
    const productCategory = (p.category || "").toLowerCase();
    const productColor = (p.color || "").toLowerCase();
    const productPrice = Number(p.price ?? 0);
    const productInStock = (p.stock ?? 0) > 0;

    const searchValue = search.toLowerCase().trim();

    // 🔥 PRICE SEARCH FIX
    let matchesPriceSearch = false;

    if (searchValue) {
      if (searchValue.includes("-")) {
        const [min, max] = searchValue.split("-").map(Number);
        if (!isNaN(min) && !isNaN(max)) {
          matchesPriceSearch =
            productPrice >= min && productPrice <= max;
        }
      } else if (!isNaN(Number(searchValue))) {
        matchesPriceSearch =
          productPrice.toString().includes(searchValue);
      }
    }

    // 🔥 TEXT SEARCH
    const matchesText =
      productName.includes(searchValue) ||
      productCategory.includes(searchValue) ||
      productColor.includes(searchValue);

    // 🔥 FINAL SEARCH
    const matchesSearch =
      !searchValue || matchesText || matchesPriceSearch;

    // 🔥 FILTERS
    const matchesPrice =
      productPrice >= appliedMinPrice &&
      productPrice <= appliedMaxPrice;

    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(p.category || "Uncategorized");

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "inStock" && productInStock) ||
      (stockFilter === "outOfStock" && !productInStock);

    return (
      matchesSearch &&
      matchesPrice &&
      matchesCategory &&
      matchesStock
    );
  });
}, [
  products,
  search,
  appliedMinPrice,
  appliedMaxPrice,
  selectedCategories,
  stockFilter,
]);

                     

                            const handleApplyPrice = () => {
                            const min = Number(minPrice) || 0;
                        const max = Number(maxPrice) || 50000;

                          setAppliedMinPrice(min);
                          setAppliedMaxPrice(max);
                        };

                          const handleCategoryChange = (category: string) => {
                            setSelectedCategories((prev) =>
                              prev.includes(category)
                                ? prev.filter((item) => item !== category)
                                : [...prev, category]
                            );
                          };

                        const clearFilters = () => {
                          setSearch("");
                          setMinPrice("0");
                          setMaxPrice("50000");
                          setAppliedMinPrice(0);
                          setAppliedMaxPrice(50000);
                          setSelectedCategories([]);
                          setStockFilter("all");
                          router.push("/products");
                        };

  return (
    <main className="min-h-screen bg-[#f7f7f9] text-slate-900">
      
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[290px_1fr]">
          <aside className="h-fit rounded-[28px] bg-white p-6 shadow-sm">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-[#233f99]">Price Range</h3>

              <div className="mt-6">
                <label className="mb-2 block text-lg font-medium text-slate-700">
                  Min Price
                </label>
                <div className="flex items-center rounded-2xl border border-slate-200 px-4">
                  <span className="mr-2 text-2xl text-slate-500">₹</span>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-transparent py-4 text-xl outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-lg font-medium text-slate-700">
                  Max Price
                </label>
                <div className="flex items-center rounded-2xl border border-slate-200 px-4">
                  <span className="mr-2 text-2xl text-slate-500">₹</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-transparent py-4 text-xl outline-none"
                    placeholder="50000"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyPrice}
                className="mt-5 w-full rounded-2xl bg-[#233f99] py-4 text-lg font-semibold text-white transition hover:bg-[#1d347d]"
              >
                Apply range
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-[#233f99]">Category</h3>

              <div className="mt-5 space-y-4">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <label
                      key={cat}
                      className="flex cursor-pointer items-center gap-3 text-[18px] text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => handleCategoryChange(cat)}
                        className="h-5 w-5 rounded border-slate-300 accent-[#233f99]"
                      />
                      <span>{cat}</span>
                    </label>
                  ))
                ) : (
                  ["Dress", "Cotton Saree", "Kathpadar Saree", "Designer Saree"].map(
                    (cat) => (
                      <label
                        key={cat}
                        className="flex cursor-pointer items-center gap-3 text-[18px] text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat)}
                          onChange={() => handleCategoryChange(cat)}
                          className="h-5 w-5 rounded border-slate-300 accent-[#233f99]"
                        />
                        <span>{cat}</span>
                      </label>
                    )
                  )
                )}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-[#233f99]">Stock</h3>

              <div className="mt-5 space-y-4">
                <label className="flex cursor-pointer items-center gap-3 text-[18px] text-slate-700">
                  <input
                    type="radio"
                    name="stock"
                    checked={stockFilter === "all"}
                    onChange={() => setStockFilter("all")}
                    className="h-5 w-5 accent-[#233f99]"
                  />
                  <span>All</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 text-[18px] text-slate-700">
                  <input
                    type="radio"
                    name="stock"
                    checked={stockFilter === "inStock"}
                    onChange={() => setStockFilter("inStock")}
                    className="h-5 w-5 accent-[#233f99]"
                  />
                  <span>In Stock</span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 text-[18px] text-slate-700">
                  <input
                    type="radio"
                    name="stock"
                    checked={stockFilter === "outOfStock"}
                    onChange={() => setStockFilter("outOfStock")}
                    className="h-5 w-5 accent-[#233f99]"
                  />
                  <span>Out of Stock</span>
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="w-full rounded-2xl border border-slate-200 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </aside>

          <div>
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-[#233f99] md:text-6xl">
                  All Products
                </h1>
                <p className="mt-2 text-lg text-slate-500">
                  Showing {filteredProducts.length} products
                </p>
              </div>

              <div className="relative w-full lg:w-[320px]">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-5 pr-16 text-lg outline-none shadow-sm focus:border-[#233f99]"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl bg-[#233f99] text-white"
                >
                  <Search size={22} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-[28px] bg-white p-12 text-center text-lg text-slate-500 shadow-sm">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-[28px] bg-white p-12 text-center text-lg text-slate-500 shadow-sm">
                No products found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {filteredProducts.map((p) => {
                  const productPrice = Number(p.price ?? 0);
                  const fakeOldPrice = Math.max(Math.round(productPrice * 1.25), productPrice);
                  const discount = Math.max(
                    10,
                    Math.min(
                      50,
                      fakeOldPrice > 0
                        ? Math.round(((fakeOldPrice - productPrice) / fakeOldPrice) * 100)
                        : 10
                    )
                  );

                  return (
                    <div
                      key={p.id}
                      className="group overflow-hidden rounded-[28px] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                     <div className="relative h-[320px] w-full overflow-hidden rounded-[20px] bg-black">
                        <ProductMediaSlider
  productName={p.name}
  imageUrl={p.imageUrl}
  imageUrls={p.imageUrls || []}
  videoUrls={p.videoUrls || []}
  mediaFiles={p.mediaFiles || []}
/>

                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition duration-300 group-hover:opacity-100">
                          <div className="flex items-center gap-3">
                           
 <button
    onClick={() => toggleWishlist(p)}
    className="absolute right-3 top-3 z-20 rounded-full bg-white/80 p-2 backdrop-blur hover:scale-110 transition"
  >
    {wishlist.includes(p.id) ? "❤️" : "🤍"}
  </button>
                            <button
                              type="button"
                              onClick={() =>
                                addToCart({
                                  id: p.id,
                                  name: p.name || "Product",
                                  price: productPrice,
                                  category: p.category || "Uncategorized",
                                  imageUrl: p.imageUrl || "",
                                })
                              }
                             disabled={(p.stock ?? 0) <= 0}
                              className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition hover:scale-105 hover:text-[#233f99] disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label="Add to cart"
                            >
                              <ShoppingCart size={22} />
                            </button>

                            <button
                              type="button"
                              onClick={() => router.push(`/products/${p.id}`)}
                              className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition hover:scale-105 hover:text-green-600"
                              aria-label="Buy now"
                            >
                              <Zap size={22} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className="min-h-[64px] text-[20px] font-semibold leading-snug text-slate-800">
                          <Link
                            href={`/products/${p.id}`}
                            className="transition hover:text-[#233f99]"
                          >
                            {p.name || "Unnamed Product"}
                          </Link>
                        </h3>

                     <div className="mt-3 flex items-center justify-between">
  <div className="flex items-end gap-3">
    <p className="text-2xl font-bold text-[#1a1a1a]">
      ₹{productPrice}
    </p>
    <p className="pb-1 text-base text-white/35 line-through">
      ₹{fakeOldPrice}
    </p>
  </div>

  
</div>

                       <div className="mt-3 flex items-center justify-between">
  {/* LEFT SIDE → CATEGORY */}
  <span className="rounded-full border border-[#f3c46b]/20 bg-[#f3c46b]/10 px-3 py-1 text-xs font-medium text-[#ffd98f]">
    {p.category || "General"}
  </span>

  {/* RIGHT SIDE → STOCK */}
  <span
    className={`text-sm font-medium ${
      (p.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"
    }`}
  >
    {(p.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}
  </span>
</div>

                        <button
                          type="button"
                          onClick={() =>
                            addToCart({
                              id: p.id,
                              name: p.name || "Product",
                              price: productPrice,
                              category: p.category || "Uncategorized",
                              imageUrl: p.imageUrl || "",
                            })
                          }
                          disabled={(p.stock ?? 0) <= 0}
                          className="mt-5 w-full rounded-2xl bg-[#233f99] py-3 font-semibold text-white transition hover:bg-[#1c327c] disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                        {(p.stock ?? 0) > 0 ? "Add to Cart" : "Out of Stock"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}



  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f9] text-slate-900">
          <Header />
          <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
            <div className="rounded-[28px] bg-white p-12 text-center text-lg text-slate-500 shadow-sm">
              Loading products...
            </div>
          </section>
        </main>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

