"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  increment,
  serverTimestamp,
  addDoc,
  updateDoc,
} from "firebase/firestore";

export default function WalletPage() {
  const [mobile, setMobile] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 📱 get user mobile
  useEffect(() => {
    const m = localStorage.getItem("mobile");
    if (m) setMobile(m);
  }, []);

  // 🔄 load data
  useEffect(() => {
    if (mobile) {
      fetchWallet();
      fetchTransactions();
    }
  }, [mobile]);

  // 💰 FETCH WALLET
  const fetchWallet = async () => {
    if (!mobile) return;

    try {
      const ref = doc(db, "wallets", mobile);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setBalance(snap.data().balance || 0);
      } else {
        setBalance(0);
      }
    } catch (err) {
      console.error("Wallet fetch error:", err);
    }
  };

  // 📜 FETCH TRANSACTIONS
  const fetchTransactions = async () => {
    if (!mobile) return;

    try {
      setLoading(true);

      const q = query(
        collection(db, "transactions"),
        where("userId", "==", mobile),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setTransactions(data);
    } catch (err) {
      console.error("Transaction fetch error:", err);
    } finally {
      setLoading(false);
    }
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

        {/* Transactions */}
        <h2 className="text-xl font-semibold text-[#7a2848] mb-3">
          Transactions
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-500">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex justify-between border p-3 rounded-lg"
              >
                <div>
                  <p className="font-medium">{t.note}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {t.type}
                  </p>
                </div>

                <div
                  className={
                    t.type === "credit"
                      ? "text-green-600 font-semibold"
                      : "text-red-500 font-semibold"
                  }
                >
                  {t.type === "credit" ? "+" : "-"}₹{t.amount}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}