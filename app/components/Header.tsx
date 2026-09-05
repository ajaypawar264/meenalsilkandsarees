"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cartCount } from "@/lib/cart";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Heart,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Search,
  User,
} from "lucide-react";

export default function Header() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [count, setCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userMobile, setUserMobile] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] =
    useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  /* =========================
     WISHLIST COUNT
  ========================= */

  useEffect(() => {
    const updateWishlist = () => {
      const stored = localStorage.getItem("wishlist");

      if (!stored) {
        setWishlistCount(0);
        return;
      }

      try {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setWishlistCount(parsed.length);
        } else {
          setWishlistCount(0);
        }
      } catch (error) {
        console.error("Wishlist parse error:", error);
        setWishlistCount(0);
      }
    };

    updateWishlist();

    window.addEventListener("wishlistUpdated", updateWishlist);
    window.addEventListener("storage", updateWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", updateWishlist);
      window.removeEventListener("storage", updateWishlist);
    };
  }, []);

  /* =========================
     CART + USER
  ========================= */

  useEffect(() => {
    const syncData = () => {
      setCount(cartCount());

      const savedUserId = localStorage.getItem("user_id");
      const savedUserName = localStorage.getItem("user_name");
      const savedUserMobile = localStorage.getItem("user_mobile");

      setIsLoggedIn(!!savedUserId);
      setUserName(savedUserName || "");
      setUserMobile(savedUserMobile || "");
    };

    syncData();

    window.addEventListener("cart_updated", syncData);
    window.addEventListener("storage", syncData);

    return () => {
      window.removeEventListener("cart_updated", syncData);
      window.removeEventListener("storage", syncData);
    };
  }, []);

  /* =========================
     LOCK PAGE SCROLL WHEN MENU OPEN
  ========================= */

  useEffect(() => {
    if (!menuOpen) {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      return;
    }

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [menuOpen]);

  /* =========================
     LOAD CATEGORIES
  ========================= */

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const snapshot = await getDocs(
          collection(db, "products")
        );

        const uniqueCategories = Array.from(
          new Set(
            snapshot.docs
              .map((item) => item.data()?.category)
              .filter(
                (cat): cat is string =>
                  typeof cat === "string" &&
                  cat.trim() !== ""
              )
          )
        );

        setCategories(uniqueCategories);
      } catch (error) {
        console.error(
          "Failed to load categories:",
          error
        );
      }
    };

    loadCategories();
  }, []);

  /* =========================
     CLOSE DROPDOWN
  ========================= */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setProductDropdownOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /* =========================
     CATEGORIES
  ========================= */

  const fallbackCategories = useMemo(
    () => [
      "Paithani",
      "Silk Saree",
      "Designer Saree",
      "Wedding Saree",
    ],
    []
  );

  const displayCategories =
    categories.length > 0
      ? categories.slice(0, 6)
      : fallbackCategories;

  /* =========================
     SEARCH
  ========================= */

  const handleSearch = (
    e?: React.FormEvent
  ) => {
    e?.preventDefault();

    const value = search.trim();

    if (!value) return;

    router.push(
      `/products?search=${encodeURIComponent(value)}`
    );

    setSearch("");
    setMenuOpen(false);
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_mobile");

    setIsLoggedIn(false);
    setUserName("");
    setUserMobile("");
    setMenuOpen(false);

    router.push("/");
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setProductDropdownOpen(false);
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-[100] border-b border-slate-200 bg-white/95 backdrop-blur-md">

      <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 md:px-6">

        {/* =====================================================
            MOBILE HEADER
        ===================================================== */}

        <div className="lg:hidden">

          {/* TOP ROW */}

          <div className="flex min-h-[72px] items-center justify-between gap-2">

            {/* LOGO */}

            <Link
              href="/"
              onClick={closeMenu}
              className="shrink-0"
            >
              <img
                src="/logo2.png"
                alt="Meenal Silk Logo"
                className="h-14 w-auto max-w-[150px] object-contain sm:h-16 sm:max-w-[175px]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </Link>

            {/* RIGHT ICONS */}

            <div className="flex items-center gap-0.5">

              {/* LOGIN */}

              <Link
                href={
                  isLoggedIn
                    ? "/my-orders"
                    : "/login"
                }
                className="flex h-9 items-center gap-1 rounded-full px-2 text-slate-700 hover:bg-slate-100"
              >
                <User size={18} />

                <span className="hidden text-xs font-semibold min-[380px]:block">
                  {isLoggedIn ? "Account" : "Login"}
                </span>
              </Link>

              {/* WISHLIST */}

              <Link
                href="/wishlist"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
                aria-label="Wishlist"
              >
                <Heart size={19} />

                {wishlistCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-[15px] items-center justify-center rounded-full bg-red-500 px-1 text-[8px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* CART */}

              <Link
                href="/cart"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
                aria-label="Cart"
              >
                <ShoppingBag size={19} />

                {count > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-[15px] items-center justify-center rounded-full bg-[#d4a63f] px-1 text-[8px] font-bold text-white">
                    {count}
                  </span>
                )}
              </Link>

              {/* MENU */}

              <button
                type="button"
                onClick={() =>
                  setMenuOpen((prev) => !prev)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
                aria-label="Open menu"
              >
                {menuOpen ? (
                  <X size={22} />
                ) : (
                  <Menu size={22} />
                )}
              </button>

            </div>
          </div>

          {/* SEARCH BAR */}

          <form
            onSubmit={handleSearch}
            className="pb-2"
          >
            <div className="relative">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search sarees..."
                className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#b88639] focus:bg-white"
              />

            </div>
          </form>

          {/* QUICK SHOP BUTTONS */}

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">

            <Link
              href="/products"
              onClick={closeMenu}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
            >
              Products
            </Link>

            <Link
              href="/daily-offer"
              onClick={closeMenu}
              className="shrink-0 rounded-full bg-gradient-to-r from-[#b88639] to-[#f2c76b] px-4 py-2 text-xs font-bold text-black shadow-sm"
            >
              Daily Video 🔥
            </Link>

            <Link
              href="/gallery"
              onClick={closeMenu}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
            >
              Gallery
            </Link>

            <Link
              href="/about"
              onClick={closeMenu}
              className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm"
            >
              About
            </Link>

          </div>

        </div>

        {/* =====================================================
            DESKTOP HEADER
        ===================================================== */}

        <div className="hidden min-h-[86px] items-center justify-between gap-3 lg:flex">

          {/* LOGO */}

          <Link
            href="/"
            onClick={closeMenu}
            className="shrink-0"
          >
            <div className="flex items-center gap-2">

              <img
                src="/logo2.png"
                alt="Meenal Silk Logo"
                className="h-14 w-auto object-contain md:h-20"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              <span className="text-lg font-bold text-[#b88639]">
                MEENAL SILK
              </span>

            </div>
          </Link>

          {/* WALLET */}

          <Link
            href="/wallet"
            className="font-semibold text-green-600"
          >
            Wallet
          </Link>

          {/* NAV */}

          <nav className="flex min-w-0 items-center gap-4 xl:gap-6">

            <Link
              href="/"
              className="text-[17px] font-medium text-slate-700 hover:text-[#233f99]"
            >
              Home
            </Link>

            <Link
              href="/gallery"
              className="text-[17px] font-medium text-slate-700 hover:text-[#b88639]"
            >
              Gallery
            </Link>

            {/* PRODUCTS */}

            <div
              className="relative"
              ref={dropdownRef}
            >

              <button
                type="button"
                onClick={() =>
                  setProductDropdownOpen(
                    (prev) => !prev
                  )
                }
                className="flex items-center gap-1 text-[17px] font-medium text-slate-700 hover:text-[#233f99]"
              >
                Products
                <ChevronDown size={18} />
              </button>

              {productDropdownOpen && (
                <div className="absolute left-0 top-[calc(100%+14px)] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

                  <div className="border-b border-slate-100 px-4 py-3">

                    <p className="text-sm font-semibold text-[#233f99]">
                      Shop Categories
                    </p>

                  </div>

                  <div className="p-2">

                    <Link
                      href="/products"
                      onClick={() =>
                        setProductDropdownOpen(false)
                      }
                      className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-[#eef2ff]"
                    >
                      All Products
                    </Link>

                    {displayCategories.map(
                      (cat) => (
                        <Link
                          key={cat}
                          href={`/products?category=${encodeURIComponent(
                            cat
                          )}`}
                          onClick={() =>
                            setProductDropdownOpen(false)
                          }
                          className="block rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-[#eef2ff]"
                        >
                          {cat}
                        </Link>
                      )
                    )}

                  </div>
                </div>
              )}

            </div>

            <Link
              href="/about"
              className="text-[17px] font-medium text-slate-700 hover:text-[#233f99]"
            >
              About
            </Link>

            <Link
              href="/daily-offer"
              className="whitespace-nowrap rounded-full bg-gradient-to-r from-[#b88639] to-[#f2c76b] px-4 py-2 text-sm font-semibold text-black"
            >
              Daily Offer 🔥
            </Link>

            <Link
              href="/contact"
              className="text-[17px] font-medium text-slate-700 hover:text-[#233f99]"
            >
              Contact
            </Link>

          </nav>

          {/* DESKTOP SEARCH */}

          <form
            onSubmit={handleSearch}
            className="hidden xl:block"
          >
            <div className="relative w-52">

              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search..."
                className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-[#b88639]"
              />

            </div>
          </form>

          {/* DESKTOP WISHLIST */}

          <Link
            href="/wishlist"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <Heart size={24} />

            {wishlistCount > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* DESKTOP CART */}

          <Link
            href="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <ShoppingBag size={24} />

            {count > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#d4a63f] px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {/* DESKTOP MENU */}

          <button
            type="button"
            onClick={() =>
              setMenuOpen((prev) => !prev)
            }
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
            aria-label="Open menu"
          >
            {menuOpen ? (
              <X size={24} />
            ) : (
              <Menu size={24} />
            )}
          </button>

        </div>

        {/* =====================================================
            MENU
        ===================================================== */}

        <div
          className={`overflow-hidden transition-all duration-300 ${
            menuOpen
              ? "max-h-[calc(100vh-130px)] pb-4 opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >

          {/* MENU SCROLL AREA */}

          <div
            className="
              max-h-[calc(100vh-150px)]
              overflow-y-auto
              overscroll-contain
              touch-pan-y
              rounded-3xl
              border border-slate-200
              bg-white
              p-4
              shadow-xl
              [-webkit-overflow-scrolling:touch]
            "
          >

            {/* USER */}

            {isLoggedIn && (
              <div className="mb-4 rounded-2xl bg-[#f8faff] px-4 py-3">

                <p className="text-xs text-slate-500">
                  Welcome
                </p>

                <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                  {userName ||
                    userMobile ||
                    "User"}
                </p>

              </div>
            )}

            <div className="grid gap-2">

              <Link
                href="/"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Home
              </Link>

              <Link
                href="/gallery"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Gallery
              </Link>

              <div className="rounded-2xl border border-slate-200 p-2">

                <Link
                  href="/products"
                  onClick={closeMenu}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Products
                </Link>

                <div className="mt-2 grid gap-1">

                  {displayCategories.map(
                    (cat) => (
                      <Link
                        key={cat}
                        href={`/products?category=${encodeURIComponent(
                          cat
                        )}`}
                        onClick={closeMenu}
                        className="rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-[#eef2ff]"
                      >
                        {cat}
                      </Link>
                    )
                  )}

                </div>

              </div>

              <Link
                href="/about"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                About
              </Link>

              <Link
                href="/contact"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Contact
              </Link>

              <Link
                href="/daily-offer"
                onClick={closeMenu}
                className="rounded-xl bg-gradient-to-r from-[#b88639] to-[#f2c76b] px-4 py-3 text-sm font-semibold text-black"
              >
                Daily Offer 🔥
              </Link>

              <Link
                href="/wallet"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-green-600 hover:bg-green-50"
              >
                Wallet
              </Link>

              <Link
                href="/wishlist"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Wishlist ({wishlistCount})
              </Link>

              <Link
                href="/cart"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cart ({count})
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/my-orders"
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    My Orders
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Register
                  </Link>
                </>
              )}

            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
