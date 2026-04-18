"use client";
import {  getDoc } from "firebase/firestore";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [mobile, setMobile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 📱 get mobile
  useEffect(() => {
    const m = localStorage.getItem("mobile");
    if (m) setMobile(m);
  }, []);

  // 🔄 fetch when mobile loads
  useEffect(() => {
    if (mobile) {
      fetchWallet();
      fetchTransactions();
    }
  }, [mobile]);

  // 💰 ADD MONEY (FIXED)
  const addMoneyToWallet = async (amount: number) => {
    if (!mobile) return;

    try {
      const userRef = doc(db, "users", mobile);

      await updateDoc(userRef, {
        walletBalance: increment(Number(amount)),
      });

      await addDoc(collection(db, "transactions"), {
        userId: mobile,
        amount,
        type: "credit",
        note: "Money Added",
        createdAt: serverTimestamp(),
      });

      await fetchWallet();
      await fetchTransactions();

      console.log("✅ Wallet updated");
    } catch (err) {
      console.error("❌ Wallet error:", err);
    }
  };

 

const fetchWallet = async () => {
  if (!mobile) return;

  const ref = doc(db, "users", mobile);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    setBalance(snap.data().walletBalance || 0);
  } else {
    setBalance(0);
  }
};

  // 📜 fetch transactions
  const fetchTransactions = async () => {
    if (!mobile) return;

    setLoading(true);

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", mobile),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    setTransactions(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fff8f3] p-6">
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6">

        <h1 className="text-2xl font-bold text-[#7a2848] mb-4">
          Wallet Balance
        </h1>

        <div className="text-3xl font-bold text-green-600 mb-6">
          ₹{balance}
        </div>

        {/* ➕ Add Money */}
      

        {/* 📜 Transactions */}
        <h2 className="mt-8 text-xl font-semibold text-[#7a2848]">
          Transactions
        </h2>

        {loading ? (
          <p className="mt-3 text-sm">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No transactions yet
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex justify-between border p-3 rounded-lg"
              >
                <div>
                  <p className="font-medium">{t.note}</p>
                  <p className="text-xs text-gray-500">{t.type}</p>
                </div>
                <div className="font-semibold text-green-600">
                  +₹{t.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}