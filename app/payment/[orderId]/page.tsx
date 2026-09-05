"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();

  const [orderData, setOrderData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const orderId = params?.orderId as string;

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderRef = doc(db, "orders", orderId);
        const snap = await getDoc(orderRef);

        if (snap.exists()) {
          setOrderData(snap.data());
        }
      } catch (error) {
        console.error("FETCH ORDER ERROR:", error);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Upload payment screenshot to ImageKit API
  const uploadToImageKit = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/imagekit-auth", {
      method: "POST",
      body: formData,
    });

    const text = await res.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("Invalid JSON response:", text);
      throw new Error("Server did not return JSON");
    }

    if (!data.success || !data.url) {
      throw new Error(data.message || "Upload failed");
    }

    return data.url;
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Payment screenshot upload kara");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Step 1: Upload image
      const imageUrl = await uploadToImageKit(file);

      // Step 2: Update order
      const orderRef = doc(db, "orders", orderId);

      await updateDoc(orderRef, {
        paymentScreenshot: imageUrl,
        paymentStatus: "Pending Verification",
      });

      // Step 3: Get order data
      const orderSnap = await getDoc(orderRef);
      const latestOrderData: any = orderSnap.data();

      console.log("ORDER DATA:", latestOrderData);

      // Step 4: Stock update
      if (
        latestOrderData?.items &&
        Array.isArray(latestOrderData.items)
      ) {
        await Promise.all(
          latestOrderData.items.map(async (item: any) => {
            if (!item?.id) return;

            const productRef = doc(db, "products", item.id);

            await updateDoc(productRef, {
              stock: increment(-Number(item.quantity || 1)),
            });
          })
        );
      } else {
        console.warn("No product data found in order");
      }

      setMessage("Screenshot uploaded successfully ✅");

      setTimeout(() => {
        router.push("/my-orders");
      }, 2000);
    } catch (error) {
      console.error("UPLOAD ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-center text-2xl font-bold text-yellow-400">
          UPI Payment
        </h1>

        <p className="mt-3 text-center text-sm text-white/70">
          Order ID: {orderData?.orderId}
        </p>

        <p className="text-center text-sm text-white/70">
          Invoice: {orderData?.invoiceNo}
        </p>

        <div className="mt-6 flex justify-center">
          <img
            src="/QR.jpg"
            alt="UPI QR Code"
            className="w-64 rounded-xl border border-white/10 bg-white p-2"
          />
        </div>

        <p className="mt-4 text-center text-base font-semibold">
          UPI ID: Q451984462@ybl
          <br />
          AC no : 0321001022154
          <br />
          IFSC : COSB0000032
          <br />
          BRANCH : Warje Pune 411052
        </p>

        <p className="mt-2 text-center text-sm text-white/60">
          Payment केल्यावर screenshot upload करा || If you make
          the payment after 10 PM, it will be verified the next
          day at 10 AM.
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
          className="mt-6 block w-full rounded-lg border border-white/10 bg-white/10 p-2 text-sm"
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-yellow-500 px-4 py-3 font-bold text-black disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload Screenshot"}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-green-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}