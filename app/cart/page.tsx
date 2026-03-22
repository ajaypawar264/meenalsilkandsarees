"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CartItem,
  getCart,
  removeFromCart,
  saveCart,
  updateQty,
} from "../../lib/cart";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const GST_RATE = 0.05; // 5%

const SHOP_DETAILS = {
  name: "Meenal Silk and Saree",
  address: "Main Road, Pune, Maharashtra, India",
  phone: "+91 9876543210",
  email: "meenalsilkstore@gmail.com",
  gstin: "27ABCDE1234F1Z5", // <- tuzha real GSTIN asel tar ithe change kar
};

type OrderItemPayload = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("COD");

  const refreshCart = () => {
    const cart = getCart();
    setItems(cart);
    setSelectedIds((prev) =>
      prev.filter((id) => cart.some((item) => item.id === id))
    );
  };

  useEffect(() => {
    refreshCart();
    window.addEventListener("cart_updated", refreshCart);
    return () => window.removeEventListener("cart_updated", refreshCart);
  }, []);

  useEffect(() => {
    const savedName = localStorage.getItem("user_name") || "";
    const savedPhone = localStorage.getItem("user_mobile") || "";

    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.includes(item.id));
  }, [items, selectedIds]);

  const subTotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [selectedItems]);

  const gstAmount = useMemo(() => subTotal * GST_RATE, [subTotal]);
  const cgstAmount = useMemo(() => gstAmount / 2, [gstAmount]);
  const sgstAmount = useMemo(() => gstAmount / 2, [gstAmount]);
  const grandTotal = useMemo(() => subTotal + gstAmount, [subTotal, gstAmount]);

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (document.getElementById("razorpay-checkout-js")) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.id = "razorpay-checkout-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const clearOrderedItemsFromCart = () => {
    const remainingItems = items.filter((item) => !selectedIds.includes(item.id));
    saveCart(remainingItems);
    setItems(remainingItems);
    setSelectedIds([]);
    window.dispatchEvent(new Event("cart_updated"));
  };

  const generateInvoiceNumber = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `MS-${Date.now()}-${random}`;
  };

  const saveOrderToFirestore = async (
    cleanName: string,
    cleanPhone: string,
    cleanAddress: string,
    paymentType: "COD" | "ONLINE",
    paymentStatus: "Pending" | "Paid"
  ) => {
    const orderItems: OrderItemPayload[] = selectedItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.qty,
      imageUrl: item.imageUrl || "",
    }));

    const invoiceNumber = generateInvoiceNumber();

    await addDoc(collection(db, "orders"), {
      customerName: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      items: orderItems,

      status: "Pending",
      paymentMethod: paymentType,
      paymentStatus,

      totalAmount: grandTotal,
      subTotal,
      gstRate: GST_RATE,
      gstAmount,
      cgstAmount,
      sgstAmount,

      invoiceNumber,
      billGenerated: true,
      billGeneratedAt: serverTimestamp(),

      shopDetails: SHOP_DETAILS,

      createdAt: serverTimestamp(),
    });
  };

  const handleCODOrder = async (
    cleanName: string,
    cleanPhone: string,
    cleanAddress: string
  ) => {
    await saveOrderToFirestore(
      cleanName,
      cleanPhone,
      cleanAddress,
      "COD",
      "Pending"
    );

    clearOrderedItemsFromCart();
    setAddress("");
    setPaymentMethod("COD");
    setMessage("COD order placed successfully ✅ Bill generated");
  };

  const handleOnlinePayment = async (
    cleanName: string,
    cleanPhone: string,
    cleanAddress: string
  ) => {
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      throw new Error("Razorpay SDK failed to load");
    }

    const createOrderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: grandTotal,
      }),
    });

    const createOrderData = await createOrderRes.json();

    if (!createOrderRes.ok || !createOrderData.success) {
      throw new Error(createOrderData.message || "Failed to create payment order");
    }

    const razorpayOrder = createOrderData.order;

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: "Meenal Silk and Saree",
      description: "Order Payment",
      order_id: razorpayOrder.id,
      handler: async function (response: any) {
        try {
          const verifyRes = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (!verifyRes.ok || !verifyData.success) {
            setMessage(verifyData.message || "Payment verification failed");
            return;
          }

          await saveOrderToFirestore(
            cleanName,
            cleanPhone,
            cleanAddress,
            "ONLINE",
            "Paid"
          );

          clearOrderedItemsFromCart();
          setAddress("");
          setPaymentMethod("COD");
          setMessage("Online payment successful ✅ Order placed with GST bill");
        } catch (error: any) {
          console.error("Verify/order save error:", error);
          setMessage(error?.message || "Payment done but order save failed");
        } finally {
          setPlacing(false);
        }
      },
      prefill: {
        name: cleanName,
        contact: cleanPhone,
      },
      theme: {
        color: "#eab308",
      },
      modal: {
        ondismiss: function () {
          setPlacing(false);
          setMessage("Payment cancelled");
        },
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  const handleOrder = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    if (!cleanName || !cleanPhone || !cleanAddress) {
      setMessage("Please fill customer details");
      return;
    }

    if (!/^\d{10}$/.test(cleanPhone)) {
      setMessage("Please enter a valid 10-digit phone number");
      return;
    }

    if (selectedItems.length === 0) {
      setMessage("Please select at least one item");
      return;
    }

    if (grandTotal <= 0) {
      setMessage("Invalid order total");
      return;
    }

    try {
      setPlacing(true);
      setMessage("");

      if (paymentMethod === "COD") {
        await handleCODOrder(cleanName, cleanPhone, cleanAddress);
      } else {
        await handleOnlinePayment(cleanName, cleanPhone, cleanAddress);
      }
    } catch (error: any) {
      console.error("Order error:", error);
      setMessage(error?.message || "Order failed ❌");
      setPlacing(false);
    } finally {
      if (paymentMethod === "COD") {
        setPlacing(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10 text-black">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Cart</h1>

        <Link href="/" className="rounded bg-black px-4 py-2 text-white">
          Back to Shop
        </Link>
      </header>

      {items.length === 0 ? (
        <div className="mt-10 space-y-4">
          <p>Cart is empty</p>
          {message && <p className="text-sm">{message}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-5 rounded-xl bg-white p-5 shadow"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="mt-1 h-5 w-5"
                />

                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-28 w-28 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded bg-gray-100 text-sm text-gray-400">
                    No Image
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p className="text-gray-500">{item.category}</p>
                  <p className="mt-2 text-xl font-bold">₹{item.price}</p>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        updateQty(item.id, item.qty - 1);
                        refreshCart();
                      }}
                      className="rounded border px-3 py-1"
                    >
                      -
                    </button>

                    <span>{item.qty}</span>

                    <button
                      type="button"
                      onClick={() => {
                        updateQty(item.id, item.qty + 1);
                        refreshCart();
                      }}
                      className="rounded border px-3 py-1"
                    >
                      +
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        removeFromCart(item.id);
                        refreshCart();
                        window.dispatchEvent(new Event("cart_updated"));
                      }}
                      className="ml-4 text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Price Details</h2>

            <div className="mb-2 flex justify-between">
              <span>Selected Items</span>
              <span>{selectedItems.length}</span>
            </div>

            <div className="mb-2 flex justify-between">
              <span>Sub Total</span>
              <span>₹{subTotal.toFixed(2)}</span>
            </div>

            <div className="mb-2 flex justify-between text-sm text-gray-600">
              <span>CGST (2.5%)</span>
              <span>₹{cgstAmount.toFixed(2)}</span>
            </div>

            <div className="mb-2 flex justify-between text-sm text-gray-600">
              <span>SGST (2.5%)</span>
              <span>₹{sgstAmount.toFixed(2)}</span>
            </div>

            <div className="mb-2 flex justify-between text-sm text-gray-600">
              <span>Total GST (5%)</span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>

            <hr className="my-3" />

            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              GST invoice will be generated with your order.
            </p>

            <div className="mt-6 space-y-3">
              <input
                type="text"
                placeholder="Customer Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />

              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="Phone"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                }
                className="w-full rounded border px-3 py-2"
              />

              <textarea
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />

              <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="font-semibold">Payment Method</p>

                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                  />
                  Cash on Delivery
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ONLINE"
                    checked={paymentMethod === "ONLINE"}
                    onChange={() => setPaymentMethod("ONLINE")}
                  />
                  Online Payment
                </label>
              </div>

              <button
                type="button"
                onClick={handleOrder}
                disabled={placing}
                className="w-full rounded bg-yellow-500 py-3 font-semibold hover:bg-yellow-400 disabled:opacity-60"
              >
                {placing
                  ? "Processing..."
                  : paymentMethod === "COD"
                  ? "Place COD Order"
                  : "Proceed to Online Payment"}
              </button>

              {message && (
                <p
                  className={`text-sm ${
                    message.includes("successfully") ||
                    message.includes("created") ||
                    message.includes("successful")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}