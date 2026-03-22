"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cartCount } from "@/lib/cart";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Heart, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [count, setCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userMobile, setUserMobile] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const uniqueCategories = Array.from(
        new Set(
          snapshot.docs
            .map((doc) => doc.data()?.category)
            .filter((cat): cat is string => !!cat)
        )
      );
      setCategories(uniqueCategories);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setProductDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fallbackCategories = useMemo(
    () => ["Paithani", "Silk Saree", "Designer Saree", "Wedding Saree"],
    []
  );

  const displayCategories =
    categories.length > 0 ? categories.slice(0, 6) : fallbackCategories;

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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-[86px] items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="shrink-0" onClick={closeMenu}>
            <div className="flex items-center gap-2">
              <img
                src="/logo2.png"
                alt="Meenal Silk Logo"
                className="h-16 w-auto object-contain md:h-20"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="hidden text-lg font-bold text-[#b88639] sm:block">
                MEENAL SILK
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="ms-cehidden itenter gap-10 lg:flex">
            <Link
              href="/"
              className="text-[17px] font-medium text-slate-700 transition hover:text-[#233f99]"
            >
              Home
            </Link>

            <Link
              href="/gallery"
              className="text-[17px] font-medium text-slate-700 transition hover:text-[#b88639]"
            >
              Gallery
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProductDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1 text-[17px] font-medium text-slate-700 transition hover:text-[#233f99]"
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
                      onClick={() => setProductDropdownOpen(false)}
                      className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#eef2ff] hover:text-[#233f99]"
                    >
                      All Products
                    </Link>

                    {displayCategories.map((cat) => (
                      <Link
                        key={cat}
                        href={`/products?category=${encodeURIComponent(cat)}`}
                        onClick={() => setProductDropdownOpen(false)}
                        className="block rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-[#eef2ff] hover:text-[#233f99]"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/about"
              className="text-[17px] font-medium text-slate-700 transition hover:text-[#233f99]"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="text-[17px] font-medium text-slate-700 transition hover:text-[#233f99]"
            >
              Contact
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="hidden h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-[#233f99] sm:flex"
              aria-label="Wishlist"
            >
              <Heart size={24} />
            </button>

            <Link
              href="/cart"
              className="relative hidden h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-[#233f99] sm:flex"
              aria-label="Cart"
            >
              <ShoppingBag size={24} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#d4a63f] px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>

            <button
  type="button"
  onClick={() => setMenuOpen((prev) => !prev)}
  className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-[#233f99]"
  aria-label="Open menu"
>
  {menuOpen ? <X size={24} /> : <Menu size={24} />}
</button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
  className={`overflow-hidden transition-all duration-300 ${
    menuOpen ? "max-h-[1000px] pb-4 opacity-100" : "max-h-0 opacity-0"
  }`}
>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
            {isLoggedIn && (
              <div className="mb-4 rounded-2xl bg-[#f8faff] px-4 py-3">
                <p className="text-xs text-slate-500">Welcome</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                  {userName || userMobile || "User"}
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Link
                href="/"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Home
              </Link>

              <Link
                href="/gallery"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Gallery
              </Link>

              <div className="rounded-2xl border border-slate-200 p-2">
                <Link
                  href="/products"
                  onClick={closeMenu}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Products
                </Link>

                <div className="mt-2 grid gap-1">
                  {displayCategories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/products?category=${encodeURIComponent(cat)}`}
                      onClick={closeMenu}
                      className="rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-[#eef2ff] hover:text-[#233f99]"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/about"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                About
              </Link>

              <Link
                href="/contact"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Contact
              </Link>

              <Link
                href="/cart"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Cart ({count})
              </Link>

              {isLoggedIn ? (
                <>
                  <Link
                    href="/my-orders"
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    My Orders
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-100"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Login
                  </Link>

                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    Register
                  </Link>
                </>
              )}

              <Link
                href="/admin-login"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}