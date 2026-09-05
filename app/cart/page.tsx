"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  CartItem,
  getCart,
  removeFromCart,
  updateQty,
} from "../../lib/cart";

export default function CartPage() {
  const router = useRouter();

  const [userMobile, setUserMobile] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  // =========================================================
  // LOAD LOGGED-IN USER
  // =========================================================
  useEffect(() => {
    const savedPhone =
      localStorage.getItem("user_mobile") || "";

    if (!savedPhone) {
      setMessage("Please login first.");
      return;
    }

    setUserMobile(savedPhone);
  }, []);

  // =========================================================
  // REFRESH CART
  // =========================================================
  const refreshCart = () => {
    const cart = getCart();

    setItems(cart);

    setSelectedIds((prev) =>
      prev.filter((id) =>
        cart.some((item) => item.id === id)
      )
    );
  };

  useEffect(() => {
    refreshCart();

    window.addEventListener(
      "cart_updated",
      refreshCart
    );

    return () => {
      window.removeEventListener(
        "cart_updated",
        refreshCart
      );
    };
  }, []);

  // =========================================================
  // SELECT ITEM
  // =========================================================
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );

    setMessage("");
  };

  // =========================================================
  // SELECT ALL
  // =========================================================
  const allSelected =
    items.length > 0 &&
    items.every((item) =>
      selectedIds.includes(item.id)
    );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(
        items.map((item) => item.id)
      );
    }

    setMessage("");
  };

  // =========================================================
  // SELECTED ITEMS
  // =========================================================
  const selectedItems = useMemo(() => {
    return items.filter((item) =>
      selectedIds.includes(item.id)
    );
  }, [items, selectedIds]);

  // =========================================================
  // TOTAL
  // =========================================================
  const selectedTotal = useMemo(() => {
    return selectedItems.reduce(
      (total, item) =>
        total + item.price * item.qty,
      0
    );
  }, [selectedItems]);

  // =========================================================
  // PROCEED TO CHECKOUT
  // =========================================================
  const handleCheckout = () => {
    if (!userMobile) {
      setMessage("Please login first.");
      return;
    }

    if (selectedIds.length === 0) {
      setMessage(
        "Please select at least one item."
      );
      return;
    }

    // Save selected item IDs
    localStorage.setItem(
      "minal_checkout_ids_v1",
      JSON.stringify(selectedIds)
    );

    router.push("/checkout");
  };

  // =========================================================
  // PAGE
  // =========================================================
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-6 text-black sm:px-6 sm:py-10">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <header className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Your Cart
        </h1>

        <Link
          href="/"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white transition hover:bg-gray-800 sm:text-base"
        >
          Back to Shop
        </Link>
      </header>

      {/* =====================================================
          LOGIN REQUIRED
      ===================================================== */}
      {!userMobile ? (
        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-red-600">
            Please login first to view your cart.
          </p>

          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-white"
          >
            Login
          </Link>
        </div>
      ) : items.length === 0 ? (

        /* ===================================================
           EMPTY CART
        =================================================== */
        <div className="mt-10 rounded-xl bg-white p-8 text-center shadow">
          <div className="text-5xl">
            🛒
          </div>

          <h2 className="mt-4 text-xl font-semibold">
            Your cart is empty
          </h2>

          <p className="mt-2 text-gray-500">
            Add some products to your cart.
          </p>

          <Link
            href="/products"
            className="mt-5 inline-block rounded-lg bg-black px-6 py-3 font-semibold text-white"
          >
            Continue Shopping
          </Link>
        </div>

      ) : (

        /* ===================================================
           CART CONTENT
        =================================================== */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* =================================================
              CART PRODUCTS
          ================================================= */}
          <div className="space-y-4 lg:col-span-2">

            {/* SELECT ALL */}
            <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow">

              <label className="flex cursor-pointer items-center gap-3 font-semibold">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-5 w-5 accent-black"
                />

                Select All
              </label>

              <span className="text-sm text-gray-500">
                {selectedIds.length} selected
              </span>
            </div>

            {/* =================================================
                PRODUCTS
            ================================================= */}
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex gap-3 rounded-xl bg-white p-4 shadow transition sm:gap-5 sm:p-5 ${
                  selectedIds.includes(item.id)
                    ? "ring-2 ring-yellow-400"
                    : ""
                }`}
              >

                {/* CHECKBOX */}
                <input
                  type="checkbox"
                  checked={selectedIds.includes(
                    item.id
                  )}
                  onChange={() =>
                    toggleSelect(item.id)
                  }
                  className="mt-1 h-5 w-5 shrink-0 accent-black"
                />

                {/* IMAGE */}
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-24 w-24 shrink-0 rounded-lg object-cover sm:h-28 sm:w-28"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 sm:h-28 sm:w-28">
                    No Image
                  </div>
                )}

                {/* DETAILS */}
                <div className="min-w-0 flex-1">

                  <h3 className="text-base font-semibold sm:text-lg">
                    {item.name}
                  </h3>

                  {item.category && (
                    <p className="mt-1 text-sm text-gray-500">
                      {item.category}
                    </p>
                  )}

                  <p className="mt-2 text-lg font-bold sm:text-xl">
                    ₹{item.price}
                  </p>

                  {/* =================================================
                      QUANTITY
                  ================================================= */}
                  <div className="mt-3 flex flex-wrap items-center gap-3">

                    <div className="flex items-center rounded-lg border border-gray-300">

                      <button
                        type="button"
                        onClick={() => {
                          updateQty(
                            item.id,
                            item.qty - 1
                          );

                          refreshCart();

                          window.dispatchEvent(
                            new Event("cart_updated")
                          );
                        }}
                        className="px-3 py-1.5 text-lg font-semibold hover:bg-gray-100"
                      >
                        −
                      </button>

                      <span className="min-w-[35px] text-center font-semibold">
                        {item.qty}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          updateQty(
                            item.id,
                            item.qty + 1
                          );

                          refreshCart();

                          window.dispatchEvent(
                            new Event("cart_updated")
                          );
                        }}
                        className="px-3 py-1.5 text-lg font-semibold hover:bg-gray-100"
                      >
                        +
                      </button>

                    </div>

                    {/* REMOVE */}
                    <button
                      type="button"
                      onClick={() => {
                        removeFromCart(item.id);

                        setSelectedIds((prev) =>
                          prev.filter(
                            (id) => id !== item.id
                          )
                        );

                        refreshCart();

                        window.dispatchEvent(
                          new Event("cart_updated")
                        );
                      }}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>

                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* =================================================
              CART SUMMARY
          ================================================= */}
          <div className="h-fit rounded-xl bg-white p-5 shadow sm:p-6 lg:sticky lg:top-6">

            <h2 className="mb-5 text-xl font-bold">
              Cart Summary
            </h2>

            {/* TOTAL CART ITEMS */}
            <div className="mb-3 flex justify-between text-gray-600">
              <span>Cart Items</span>

              <span className="font-medium text-black">
                {items.length}
              </span>
            </div>

            {/* SELECTED ITEMS */}
            <div className="mb-3 flex justify-between text-gray-600">
              <span>Selected Items</span>

              <span className="font-medium text-black">
                {selectedIds.length}
              </span>
            </div>

            <hr className="my-4" />

            {/* TOTAL */}
            <div className="mb-5 flex justify-between text-xl font-bold">
              <span>Total</span>

              <span>
                ₹{selectedTotal.toFixed(2)}
              </span>
            </div>

            {/* CHECKOUT */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={
                selectedIds.length === 0
              }
              className="w-full rounded-xl bg-yellow-500 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {selectedIds.length === 0
                ? "Select Items"
                : "Proceed to Checkout"}
            </button>

            {/* MESSAGE */}
            {message && (
              <p className="mt-4 text-center text-sm text-red-600">
                {message}
              </p>
            )}

          </div>
        </div>
      )}
    </main>
  );
}