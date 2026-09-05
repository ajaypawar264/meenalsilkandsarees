"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import Header from "../components/Header";
import ProductMediaSlider from "@/app/components/ProductMediaSlider";

import {
  Heart,
  ShoppingCart,
  Eye,
  Zap,
  Search,
  Share2,
  SlidersHorizontal,
  X,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  addToWishlist,
  removeFromWishlist,
} from "@/lib/wishlist";

import { addToCart } from "@/lib/cart";

type Product = {
  originalPrice?: number;
  discount?: number;
  description?: string;

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

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("50000");

  const [appliedMinPrice, setAppliedMinPrice] = useState(0);
  const [appliedMaxPrice, setAppliedMaxPrice] =
    useState(50000);

  const [selectedCategories, setSelectedCategories] =
    useState<string[]>([]);

  const [stockFilter, setStockFilter] = useState<
    "all" | "inStock" | "outOfStock"
  >("all");

  const [wishlist, setWishlist] = useState<string[]>([]);

  // FILTER OPEN / CLOSE
  const [showFilters, setShowFilters] =
    useState(false);

  // ==========================================
  // FETCH PRODUCTS
  // ==========================================

  useEffect(() => {
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Product[] =
          snapshot.docs.map((docItem) => {
            const data =
              docItem.data() as any;

            const colorsArray =
              Array.isArray(data.colors)
                ? data.colors
                : [];

            const firstColor =
              colorsArray.length > 0
                ? colorsArray[0]
                : null;

            const stockValue = Number(
              data.stock ?? 0
            );

            const priceValue = Number(
              data.price ?? 0
            );

            return {
              id: docItem.id,

              name:
                data.name ||
                data.baseName ||
                "Unnamed Product",

              description:
                data.description || "",

              color:
                data.color ||
                firstColor?.color ||
                "",

              price: priceValue,

              stock: stockValue,

              category:
                data.category ||
                "Uncategorized",

              originalPrice: Number(
                data.originalPrice || 0
              ),

              discount: Number(
                data.discount || 0
              ),

              inStock:
                typeof data.inStock === "boolean"
                  ? data.inStock
                  : stockValue > 0,

              imageUrl:
                firstColor?.imageUrl ||
                firstColor?.mediaFiles?.[0]?.url ||
                data.imageUrl ||
                "",

              imageUrls:
                firstColor?.mediaFiles
                  ?.map((m: any) => m.url)
                  ?.filter(Boolean) || [],

              mediaFiles:
                firstColor?.mediaFiles || [],

              videoUrls:
                data.videoUrls || [],
            };
          });

        setProducts(items);
      },

      (error) => {
        console.error(
          "Products fetch error:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // CATEGORY FROM URL
  // ==========================================

  useEffect(() => {
    const categoryFromUrl =
      searchParams.get("category");

    if (categoryFromUrl) {
      setSelectedCategories([
        categoryFromUrl,
      ]);
    }
  }, [searchParams]);

  // ==========================================
  // CATEGORIES
  // ==========================================

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((p) => p.category)
          .filter(Boolean)
      )
    );
  }, [products]);

  // ==========================================
  // FILTER PRODUCTS
  // ==========================================

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const productName =
        p.name?.toLowerCase() || "";

      const productCategory =
        p.category?.toLowerCase() || "";

      const productColor =
        p.color?.toLowerCase() || "";

      const searchValue =
        search.toLowerCase();

      const matchesSearch =
        productName.includes(searchValue) ||
        productCategory.includes(searchValue) ||
        productColor.includes(searchValue);

      const matchesPrice =
        p.price >= appliedMinPrice &&
        p.price <= appliedMaxPrice;

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(
          p.category || ""
        );

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "inStock" &&
          p.inStock) ||
        (stockFilter === "outOfStock" &&
          !p.inStock);

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

  // ==========================================
  // PRICE FILTER
  // ==========================================

  const handleApplyPrice = () => {
    let min = Number(minPrice);

    let max = Number(maxPrice);

    if (!Number.isFinite(min) || min < 0) {
      min = 0;
    }

    if (!Number.isFinite(max) || max <= 0) {
      max = 50000;
    }

    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }

    setMinPrice(String(min));
    setMaxPrice(String(max));

    setAppliedMinPrice(min);
    setAppliedMaxPrice(max);
  };

  // ==========================================
  // CATEGORY FILTER
  // ==========================================

  const handleCategoryChange = (
    category: string
  ) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter(
            (item) => item !== category
          )
        : [...prev, category]
    );
  };

  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  const clearFilters = () => {
    setSearch("");

    setMinPrice("0");
    setMaxPrice("50000");

    setAppliedMinPrice(0);
    setAppliedMaxPrice(50000);

    setSelectedCategories([]);

    setStockFilter("all");

    setShowFilters(false);

    router.push("/products");
  };

  // ==========================================
  // WISHLIST
  // ==========================================

  const toggleWishlist = async (
    product: Product
  ) => {
    try {
      if (wishlist.includes(product.id)) {
        await removeFromWishlist(
          product.id
        );

        setWishlist((prev) =>
          prev.filter(
            (id) => id !== product.id
          )
        );
      } else {
        await addToWishlist(
          product.id
        );

        setWishlist((prev) => [
          ...prev,
          product.id,
        ]);
      }
    } catch (error) {
      console.error(
        "Wishlist error:",
        error
      );
    }
  };

  // ==========================================
  // SHARE
  // ==========================================

  const handleShare = async (
    product: Product
  ) => {
    const url =
      `${window.location.origin}/products/${product.id}`;

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.share
      ) {
        await navigator.share({
          title:
            product.name ||
            "Meenal Silk And Saree",

          text:
            `Check out this beautiful saree: ${product.name}`,

          url,
        });
      } else {
        await navigator.clipboard.writeText(
          url
        );

        alert(
          "Product link copied! ✅"
        );
      }
    } catch {
      console.log(
        "Share cancelled"
      );
    }
  };

  // ==========================================
  // ADD TO CART
  // ==========================================

  const handleAddToCart = (
    product: Product
  ) => {
    if ((product.stock ?? 0) <= 0) {
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl:
        product.imageUrl || "",
      qty: 1,
    });

    alert(
      "Product added to cart! 🛒"
    );
  };

  // ==========================================
  // BUY NOW
  // ==========================================

  const handleBuyNow = (
    product: Product
  ) => {
    if ((product.stock ?? 0) <= 0) {
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      category: product.category,
      imageUrl:
        product.imageUrl || "",
   
    });

    sessionStorage.setItem(
      "checkout_selected_ids",
      JSON.stringify([product.id])
    );

    router.push("/checkout");
  };

  // ==========================================
  // ACTIVE FILTER CHECK
  // ==========================================

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategories.length > 0 ||
    stockFilter !== "all" ||
    appliedMinPrice > 0 ||
    appliedMaxPrice < 50000;

  // ==========================================
  // RETURN
  // ==========================================

  return (
    <main className="min-h-screen bg-[#f7f7f9] text-slate-900">

      <Header />

     <section className="mx-auto max-w-7xl px-4 pb-8 pt-[180px] sm:pt-[180px] md:px-6 md:pt-8">
        <div className="grid gap-8">

          <div>

            {/* ================================= */}
            {/* PAGE TITLE */}
            {/* ================================= */}

            <div className="mb-6">

              <h1 className="text-4xl font-bold text-[#233f99] md:text-6xl">
                All Products
              </h1>

              <p className="mt-2 text-lg text-slate-500">
                Showing{" "}
                {filteredProducts.length}{" "}
                products
              </p>

            </div>

            {/* ================================= */}
            {/* SEARCH + FILTER */}
            {/* ================================= */}

            <div className="mb-8">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                {/* SEARCH BAR */}

                <div className="relative flex-1">

                  <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-5 pr-14 text-base outline-none shadow-sm focus:border-[#233f99] sm:text-lg"
                  />

                  <Search
                    size={22}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-[#233f99]"
                  />

                </div>

                {/* FILTER BUTTON */}

                <button
                  type="button"
                  onClick={() =>
                    setShowFilters(
                      (prev) => !prev
                    )
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl bg-[#233f99] px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-[#1d347d]"
                >

                  {showFilters ? (
                    <X size={20} />
                  ) : (
                    <SlidersHorizontal
                      size={20}
                    />
                  )}

                  {showFilters
                    ? "Close Filter"
                    : "Filter"}

                </button>

              </div>

              {/* ================================= */}
              {/* FILTER PANEL */}
              {/* ================================= */}

              {showFilters && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {/* CATEGORY */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Category
                      </label>

                      <select
                        value={
                          selectedCategories.length ===
                          1
                            ? selectedCategories[0]
                            : ""
                        }
                        onChange={(e) => {
                          const value =
                            e.target.value;

                          if (value) {
                            setSelectedCategories([
                              value,
                            ]);
                          } else {
                            setSelectedCategories(
                              []
                            );
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#233f99]"
                      >

                        <option value="">
                          All Categories
                        </option>

                        {categories.map(
                          (cat) => (
                            <option
                              key={cat}
                              value={cat}
                            >
                              {cat}
                            </option>
                          )
                        )}

                      </select>
                    </div>

                    {/* STOCK */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Stock
                      </label>

                      <select
                        value={stockFilter}
                        onChange={(e) =>
                          setStockFilter(
                            e.target.value as
                              | "all"
                              | "inStock"
                              | "outOfStock"
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#233f99]"
                      >

                        <option value="all">
                          All Products
                        </option>

                        <option value="inStock">
                          In Stock
                        </option>

                        <option value="outOfStock">
                          Out of Stock
                        </option>

                      </select>
                    </div>

                    {/* MIN PRICE */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Min Price
                      </label>

                      <div className="flex items-center rounded-xl border border-slate-200 px-3">

                        <span className="mr-1 text-slate-500">
                          ₹
                        </span>

                        <input
                          type="number"
                          value={minPrice}
                          onChange={(e) =>
                            setMinPrice(
                              e.target.value
                            )
                          }
                          placeholder="0"
                          className="w-full py-3 text-sm outline-none"
                        />

                      </div>
                    </div>

                    {/* MAX PRICE */}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Max Price
                      </label>

                      <div className="flex items-center rounded-xl border border-slate-200 px-3">

                        <span className="mr-1 text-slate-500">
                          ₹
                        </span>

                        <input
                          type="number"
                          value={maxPrice}
                          onChange={(e) =>
                            setMaxPrice(
                              e.target.value
                            )
                          }
                          placeholder="50000"
                          className="w-full py-3 text-sm outline-none"
                        />

                      </div>
                    </div>

                  </div>

                  {/* ================================= */}
                  {/* FILTER BUTTONS */}
                  {/* ================================= */}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">

                    <button
                      type="button"
                      onClick={handleApplyPrice}
                      className="flex-1 rounded-xl bg-[#233f99] py-3 font-semibold text-white transition hover:bg-[#1d347d]"
                    >
                      Apply Filter
                    </button>

                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex-1 rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Clear Filter
                    </button>

                  </div>

                  {/* ================================= */}
                  {/* SELECTED CATEGORIES */}
                  {/* ================================= */}

                  {selectedCategories.length >
                    0 && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">

                      {selectedCategories.map(
                        (cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() =>
                              handleCategoryChange(
                                cat
                              )
                            }
                            className="flex items-center gap-1 rounded-full bg-[#eef2ff] px-3 py-1.5 text-xs font-medium text-[#233f99]"
                          >
                            {cat}
                            <X
                              size={14}
                            />
                          </button>
                        )
                      )}

                    </div>
                  )}

                </div>
              )}

              {/* ================================= */}
              {/* ACTIVE FILTER INFO */}
              {/* ================================= */}

              {hasActiveFilters &&
                !showFilters && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">

                    <span className="text-xs font-semibold text-slate-500">
                      Filters applied:
                    </span>

                    {search && (
                      <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#233f99]">
                        Search: {search}
                      </span>
                    )}

                    {selectedCategories.map(
                      (cat) => (
                        <span
                          key={cat}
                          className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#233f99]"
                        >
                          {cat}
                        </span>
                      )
                    )}

                    {stockFilter !==
                      "all" && (
                      <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#233f99]">
                        {stockFilter ===
                        "inStock"
                          ? "In Stock"
                          : "Out of Stock"}
                      </span>
                    )}

                    {appliedMinPrice >
                      0 && (
                      <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#233f99]">
                        Min ₹
                        {appliedMinPrice}
                      </span>
                    )}

                    {appliedMaxPrice <
                      50000 && (
                      <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-medium text-[#233f99]">
                        Max ₹
                        {appliedMaxPrice}
                      </span>
                    )}

                  </div>
                )}

            </div>

            {/* ===================================== */}
            {/* PRODUCTS GRID */}
            {/* MOBILE = 2 */}
            {/* DESKTOP = 4 */}
            {/* ===================================== */}

            {filteredProducts.length ===
            0 ? (

              <div className="rounded-[28px] bg-white p-12 text-center text-lg text-slate-500 shadow-sm">
                No products found.
              </div>

            ) : (

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">

                {filteredProducts.map(
                  (p) => {

                    const productPrice =
                      Number(
                        p.price ?? 0
                      );

                    const oldPrice =
                      p.originalPrice &&
                      p.originalPrice > 0
                        ? p.originalPrice
                        : Math.round(
                            productPrice *
                              1.25
                          );

                    const discountPercent =
                      oldPrice >
                      productPrice
                        ? Math.round(
                            ((oldPrice -
                              productPrice) /
                              oldPrice) *
                              100
                          )
                        : 0;

                    return (

                      <div
                        key={p.id}
                        className="group overflow-hidden rounded-[20px] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:rounded-[28px]"
                      >

                        {/* ================================= */}
                        {/* PHOTO */}
                        {/* ================================= */}

                        <div className="relative h-[220px] w-full overflow-hidden rounded-[16px] bg-black sm:h-[320px] sm:rounded-[20px]">

                          <ProductMediaSlider
                            productName={
                              p.name
                            }
                            imageUrl={
                              p.imageUrl
                            }
                            imageUrls={
                              p.imageUrls ||
                              []
                            }
                            videoUrls={
                              p.videoUrls ||
                              []
                            }
                            mediaFiles={
                              p.mediaFiles ||
                              []
                            }
                          />

                          {/* DISCOUNT */}

                          {discountPercent >
                            0 && (

                            <div className="absolute left-2 top-2 z-20 rounded-xl bg-red-500 px-2 py-1 text-[10px] font-semibold text-white sm:left-4 sm:top-4 sm:px-3 sm:text-sm">
                              {
                                discountPercent
                              }%
                              OFF
                            </div>

                          )}

                          {/* SOLD OUT */}

                          {(p.stock ?? 0) <=
                            0 && (

                            <div className="absolute left-2 top-12 z-20 rounded-xl bg-slate-600 px-2 py-1 text-[10px] font-semibold text-white sm:left-4 sm:top-16 sm:px-3 sm:text-sm">
                              Sold Out
                            </div>

                          )}

                          {/* ================================= */}
                          {/* PHOTO BUTTONS */}
                          {/* ================================= */}

                          <div
                            className="
                              absolute inset-0 z-30
                              flex items-center justify-center
                              bg-black/10
                              opacity-100
                              transition duration-300
                              sm:opacity-0
                              sm:group-hover:opacity-100
                            "
                          >

                            <div className="flex items-center gap-2 sm:gap-3">

                              {/* WISHLIST */}

                              <button
                                type="button"
                                onClick={() =>
                                  toggleWishlist(
                                    p
                                  )
                                }
                                className="
                                  flex h-10 w-10
                                  items-center justify-center
                                  rounded-full
                                  bg-white
                                  text-slate-700
                                  shadow-md
                                  transition
                                  hover:scale-110
                                  hover:text-red-500
                                  sm:h-12 sm:w-12
                                "
                                aria-label="Wishlist"
                                title="Wishlist"
                              >

                                <Heart
                                  size={19}
                                  fill={
                                    wishlist.includes(
                                      p.id
                                    )
                                      ? "currentColor"
                                      : "none"
                                  }
                                  className={
                                    wishlist.includes(
                                      p.id
                                    )
                                      ? "text-red-500"
                                      : ""
                                  }
                                />

                              </button>

                              {/* ADD TO CART */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleAddToCart(
                                    p
                                  )
                                }
                                disabled={
                                  (p.stock ??
                                    0) <=
                                  0
                                }
                                className="
                                  flex h-10 w-10
                                  items-center justify-center
                                  rounded-full
                                  bg-white
                                  text-slate-700
                                  shadow-md
                                  transition
                                  hover:scale-110
                                  hover:text-[#233f99]
                                  disabled:cursor-not-allowed
                                  disabled:opacity-50
                                  sm:h-12 sm:w-12
                                "
                                aria-label="Add to cart"
                                title="Add to Cart"
                              >

                                <ShoppingCart
                                  size={19}
                                />

                              </button>

                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/products/${p.id}`
                                  )
                                }
                                className="
                                  flex h-10 w-10
                                  items-center justify-center
                                  rounded-full
                                  bg-white
                                  text-slate-700
                                  shadow-md
                                  transition
                                  hover:scale-110
                                  hover:text-green-600
                                  sm:h-12 sm:w-12
                                "
                                aria-label="View product"
                                title="View Product"
                              >

                                <Eye
                                  size={19}
                                />

                              </button>

                            </div>

                          </div>

                        </div>

                        {/* ================================= */}
                        {/* PRODUCT DETAILS */}
                        {/* ================================= */}

                        <div className="p-3 sm:p-5">

                          {/* PRODUCT NAME */}

                          <h3 className="min-h-[48px] text-[14px] font-semibold leading-snug text-slate-800 sm:min-h-[64px] sm:text-[20px]">

                            <Link
                              href={`/products/${p.id}`}
                              className="transition hover:text-[#233f99]"
                            >
                              {p.name ||
                                "Unnamed Product"}
                            </Link>

                          </h3>

                          {/* COLOR */}

                          {p.color && (

                            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                              Color:{" "}
                              {p.color}
                            </p>

                          )}

                          {/* PRICE */}

                          <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-3 sm:gap-3">

                            <p className="text-lg font-bold text-[#233f99] sm:text-2xl">
                              ₹
                              {
                                productPrice
                              }
                            </p>

                            {oldPrice >
                              productPrice && (

                              <p className="text-xs text-slate-400 line-through sm:text-base">
                                ₹{oldPrice}
                              </p>

                            )}

                          </div>

                          {/* CATEGORY + STOCK */}

                          <div className="mt-2 flex items-center justify-between gap-1 sm:mt-3 sm:gap-2">

                            <span className="max-w-[55%] truncate rounded-full bg-[#eef2ff] px-2 py-1 text-[10px] font-medium text-[#233f99] sm:px-3 sm:text-xs">
                              {p.category ||
                                "General"}
                            </span>

                            <span
                              className={`text-[10px] font-medium sm:text-sm ${
                                (p.stock ??
                                  0) > 0
                                  ? "text-green-600"
                                  : "text-red-500"
                              }`}
                            >
                              {(p.stock ??
                                0) > 0
                                ? "In Stock"
                                : "Out of Stock"}
                            </span>

                          </div>

                          {/* ================================= */}
                          {/* BOTTOM BUTTONS */}
                          {/* BUY NOW + SHARE */}
                          {/* ================================= */}

                          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">

                            {/* BUY NOW */}

                            <button
                              type="button"
                              disabled={
                                (p.stock ??
                                  0) <=
                                0
                              }
                              onClick={() =>
                                handleBuyNow(
                                  p
                                )
                              }
                              className="
                                flex items-center
                                justify-center
                                gap-1.5
                                rounded-xl
                                bg-[#233f99]
                                py-2.5
                                text-xs
                                font-semibold
                                text-white
                                transition
                                hover:bg-[#1c327c]
                                disabled:cursor-not-allowed
                                disabled:bg-slate-300
                                sm:rounded-2xl
                                sm:py-3
                                sm:text-base
                              "
                            >

                              <Zap
                                size={15}
                                className="sm:h-[18px] sm:w-[18px]"
                              />

                              {(p.stock ??
                                0) > 0
                                ? "Buy Now"
                                : "Sold Out"}

                            </button>

                            {/* SHARE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleShare(
                                  p
                                )
                              }
                              className="
                                flex items-center
                                justify-center
                                gap-1.5
                                rounded-xl
                                border
                                border-[#233f99]
                                bg-white
                                py-2.5
                                text-xs
                                font-semibold
                                text-[#233f99]
                                transition
                                hover:bg-[#233f99]
                                hover:text-white
                                sm:rounded-2xl
                                sm:py-3
                                sm:text-base
                              "
                            >

                              <Share2
                                size={15}
                                className="sm:h-[18px] sm:w-[18px]"
                              />

                              Share

                            </button>

                          </div>

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            )}

          </div>

        </div>

      </section>

    </main>
  );
}