"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, getDoc, increment, serverTimestamp, updateDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { getNextInvoiceNo, getNextOrderId } from "@/lib/counters";
import { CartItem, getCart, saveCart } from "@/lib/cart";

const GST_RATE = 0.05;

const SHOP_DETAILS = {
  name: "Meenal Silk and Saree",
  address: "Main Road, Pune, Maharashtra, India",
  phone: "+91 9876543210",
  email: "meenalsilkstore@gmail.com",
  gstin: "27ABCDE1234F1Z5",
};

export default function CheckoutPage() {
  const router = useRouter();

  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");

  const [useWallet, setUseWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const [placing, setPlacing] = useState(false);

  // --------------------------------------------------
  // LOAD CHECKOUT DATA
  // --------------------------------------------------
  useEffect(() => {
    const cart = getCart();
    setItems(cart);

    const storedSelected = sessionStorage.getItem("checkout_selected_ids");

    if (storedSelected) {
      try {
        const ids = JSON.parse(storedSelected);

        if (Array.isArray(ids) && ids.length > 0) {
          setSelectedIds(ids);
        } else {
          setSelectedIds(cart.map((item) => item.id));
        }
      } catch {
        setSelectedIds(cart.map((item) => item.id));
      }
    } else {
      setSelectedIds(cart.map((item) => item.id));
    }

    const savedName = localStorage.getItem("user_name");
    const savedPhone = localStorage.getItem("user_mobile");

    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);

    // Wallet
    const userId = localStorage.getItem("user_id");

    if (userId) {
      getDoc(doc(db, "users", userId))
        .then((snap) => {
          if (snap.exists()) {
            const data = snap.data();

            setWalletBalance(
              Number(data.walletBalance ?? data.wallet ?? 0)
            );
          }
        })
        .catch(() => {
          setWalletBalance(0);
        });
    }
  }, []);

  // --------------------------------------------------
  // SELECTED ITEMS
  // --------------------------------------------------
  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  // --------------------------------------------------
  // TOTALS
  // --------------------------------------------------
  const subtotal = useMemo(() => {
    return selectedItems.reduce(
      (total, item) => total + Number(item.price) * Number(item.qty),
      0
    );
  }, [selectedItems]);

  const gst = subtotal * GST_RATE;
  const cgst = gst / 2;
  const sgst = gst / 2;

  const grandTotal = subtotal + gst;

  const walletUsed =
    useWallet
      ? Math.min(walletBalance, grandTotal)
      : 0;

  const finalAmount = Math.max(
    0,
    grandTotal - walletUsed
  );

  // --------------------------------------------------
  // PLACE ORDER
  // --------------------------------------------------
  async function handlePlaceOrder() {
    if (placing) return;

    setMessage("");

    if (!selectedItems.length) {
      setMessage("Please select at least one product.");
      return;
    }

    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      setMessage("Please enter your mobile number.");
      return;
    }

    if (!/^[0-9+\-\s]{10,15}$/.test(phone.trim())) {
      setMessage("Please enter a valid mobile number.");
      return;
    }

    if (!address.trim()) {
      setMessage("Please enter your delivery address.");
      return;
    }

    if (grandTotal <= 0) {
      setMessage("Invalid order amount.");
      return;
    }

    try {
      setPlacing(true);

      // Save customer details
      localStorage.setItem("user_name", name.trim());
      localStorage.setItem("user_mobile", phone.trim());

      // Generate IDs
      const orderId = await getNextOrderId();
      const invoiceNo = await getNextInvoiceNo();

      // Create order
      const orderRef = await addDoc(collection(db, "orders"), {
        orderId,

        customerName: name.trim(),
        phone: phone.trim(),
        address: address.trim(),

        items: selectedItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          qty: Number(item.qty),
          imageUrl: item.imageUrl || "",
          category: item.category || "",
        })),

        paymentMethod: "ONLINE",
        paymentStatus: "Pending",

        paymentScreenshot: "",

        status: "Pending",

        returnStatus: "Not Requested",

        returnEligibleTill: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ),

        totalAmount: finalAmount,

        walletUsed,

        subtotal,
        gst,
        cgst,
        sgst,
        grandTotal,

        invoiceNo,

        billGenerated: false,
        billGeneratedAt: null,

        shopDetails: SHOP_DETAILS,

        createdAt: serverTimestamp(),
      });

      // --------------------------------------------------
      // WALLET DEDUCTION
      // --------------------------------------------------
      if (useWallet && walletUsed > 0) {
        const userId = localStorage.getItem("user_id");

        if (userId) {
          const userRef = doc(db, "users", userId);

          await updateDoc(userRef, {
            walletBalance: increment(-walletUsed),
          });

          await addDoc(collection(db, "transactions"), {
            userId,
            type: "DEBIT",
            amount: walletUsed,
            orderId,
            orderRef: orderRef.id,
            description: `Wallet used for order ${orderId}`,
            createdAt: serverTimestamp(),
          });
        }
      }

      // --------------------------------------------------
      // REMOVE ORDERED ITEMS FROM CART
      // --------------------------------------------------
      const remainingItems = items.filter(
        (item) => !selectedIds.includes(item.id)
      );

      saveCart(remainingItems);

      sessionStorage.removeItem("checkout_selected_ids");

      // --------------------------------------------------
      // PAYMENT PAGE
      // --------------------------------------------------
      router.push(`/payment/${orderRef.id}`);
    } catch (error) {
      console.error("ORDER ERROR:", error);

      setMessage(
        "Order place karta ala nahi. Please try again."
      );
    } finally {
      setPlacing(false);
    }
  }

  // --------------------------------------------------
  // NO ITEMS
  // --------------------------------------------------
  if (!items.length) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold mb-3">
            Your cart is empty
          </h1>

          <p className="text-gray-500 mb-6">
            Please add products before checkout.
          </p>

          <button
            onClick={() => router.push("/")}
            className="w-full rounded-xl bg-black text-white py-3 font-semibold"
          >
            Continue Shopping
          </button>
        </div>
      </main>
    );
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------
  return (
    <main className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/cart")}
            className="text-sm font-medium"
          >
            ← Back to Cart
          </button>

          <h1 className="text-xl md:text-2xl font-bold">
            Checkout
          </h1>

          <div className="w-20" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">

        {message && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">

            {/* PRODUCTS */}
            <section className="bg-white rounded-2xl shadow-sm border p-5">
              <h2 className="text-lg font-bold mb-5">
                Order Summary
              </h2>

              <div className="space-y-4">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b last:border-b-0 pb-4 last:pb-0"
                  >
                    <div className="w-20 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {item.name}
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        Qty: {item.qty}
                      </p>

                      <p className="font-bold mt-2">
                        ₹{(Number(item.price) * Number(item.qty)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No products selected.
                </div>
              )}
            </section>

            {/* DELIVERY DETAILS */}
            <section className="bg-white rounded-2xl shadow-sm border p-5">
              <h2 className="text-lg font-bold mb-5">
                Delivery Details
              </h2>

              <div className="space-y-4">

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mobile Number
                  </label>

                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter mobile number"
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Delivery Address
                  </label>

                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter complete delivery address"
                    rows={4}
                    className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>

              </div>
            </section>

            {/* PAYMENT */}
            <section className="bg-white rounded-2xl shadow-sm border p-5">
              <h2 className="text-lg font-bold mb-5">
                Payment Method
              </h2>

              <div className="border rounded-xl p-4 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-4 border-black bg-white" />

                  <div>
                    <p className="font-semibold">
                      UPI / Online Payment
                    </p>

                    <p className="text-sm text-gray-500">
                      Pay using UPI QR and upload payment screenshot.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* WALLET */}
            <section className="bg-white rounded-2xl shadow-sm border p-5">

              <div className="flex items-center justify-between gap-4">

                <div>
                  <h2 className="font-bold">
                    Use Wallet
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Available Balance: ₹{walletBalance.toFixed(2)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (walletBalance > 0) {
                      setUseWallet(!useWallet);
                    }
                  }}
                  disabled={walletBalance <= 0}
                  className={`relative w-12 h-7 rounded-full transition ${
                    useWallet
                      ? "bg-black"
                      : "bg-gray-300"
                  } ${
                    walletBalance <= 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white transition ${
                      useWallet
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>

              </div>

              {useWallet && walletUsed > 0 && (
                <div className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  ₹{walletUsed.toFixed(2)} will be deducted from your wallet.
                </div>
              )}

            </section>

          </div>

          {/* RIGHT */}
          <div className="lg:col-span-1">

            <section className="bg-white rounded-2xl shadow-sm border p-5 lg:sticky lg:top-24">

              <h2 className="text-lg font-bold mb-5">
                Price Details
              </h2>

              <div className="space-y-3 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Subtotal
                  </span>

                  <span>
                    ₹{subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    CGST (2.5%)
                  </span>

                  <span>
                    ₹{cgst.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    SGST (2.5%)
                  </span>

                  <span>
                    ₹{sgst.toFixed(2)}
                  </span>
                </div>

                <div className="border-t pt-3 flex justify-between font-semibold">
                  <span>
                    Total
                  </span>

                  <span>
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>

                {walletUsed > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Wallet
                    </span>

                    <span>
                      - ₹{walletUsed.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="border-t pt-4 flex justify-between text-lg font-bold">
                  <span>
                    Payable
                  </span>

                  <span>
                    ₹{finalAmount.toFixed(2)}
                  </span>
                </div>

              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing || selectedItems.length === 0}
                className="mt-6 w-full rounded-xl bg-black text-white py-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition"
              >
                {placing
                  ? "Processing..."
                  : `Proceed to Payment ₹${finalAmount.toFixed(2)}`}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                You will be redirected to the payment page after placing the order.
              </p>

            </section>

          </div>

        </div>
      </div>
    </main>
  );
}