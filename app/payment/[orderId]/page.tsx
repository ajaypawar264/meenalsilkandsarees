"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Payment screenshot upload kara");
      return;
    }

    setLoading(true);

    try {
      const reader = new FileReader();

      reader.onloadend = async () => {
        try {
          await updateDoc(doc(db, "orders", orderId), {
            paymentScreenshot: reader.result,
            paymentStatus: "Pending Verification",
          });

          alert("Screenshot uploaded successfully");
          router.push("/my-orders");
        } catch (error) {
          console.error(error);
          alert("Upload failed");
        } finally {
          setLoading(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-center text-2xl font-bold text-yellow-400">
          UPI Payment
        </h1>

        <p className="mt-3 text-center text-sm text-white/70">
          Order ID: {orderId}
        </p>

        <div className="mt-6 flex justify-center">
          <img
            src="\qr2.jpeg"
            alt="UPI QR Code"
            className="w-64 rounded-xl border border-white/10 bg-white p-2"
          />
        </div>

        <p className="mt-4 text-center text-base font-semibold">
          UPI ID: Q451984462@ybl
        </p>

        <p className="mt-2 text-center text-sm text-white/60">
          Payment kelya nantar screenshot upload kara
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mt-6 block w-full rounded-lg border border-white/10 bg-white/10 p-2 text-sm"
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-yellow-500 px-4 py-3 font-bold text-black disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload Screenshot"}
        </button>
      </div>
    </div>
  );
}