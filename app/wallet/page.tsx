"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { getAuth } from "firebase/auth"; // ✅ ADD

type Transaction = {
  id: string;
  amount: number;
  type: "credit" | "debit";
  createdAt: any;
  note?: string;
};

export default function WalletPage() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userId, setUserId] = useState<string | null>(null); // ✅ ADD
  const [loading, setLoading] = useState(true); // ✅ ADD

  // ✅ AUTH USER GET
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      setUserId(user.uid);
    }
  }, []);

  // ✅ FETCH DATA ONLY WHEN userId AVAILABLE
  useEffect(() => {
    if (userId) {
      fetchWallet();
      fetchTransactions();
    }
  }, [userId]);

  const fetchWallet = async () => {
    if (!userId) return;

    const docRef = doc(db, "users", userId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      setBalance(snap.data().walletBalance || 0);
    }
  };

  const fetchTransactions = async () => {
    if (!userId) return;

    setLoading(true);

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as any),
    }));

    setTransactions(data);
    setLoading(false);
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    if (date.toDate) return date.toDate().toLocaleString("en-IN");
    return new Date(date).toLocaleString("en-IN");
  };

  return (
    <main className="min-h-screen bg-[#fff8f3] p-4 md:p-8 text-[#3b1f1f]">
      <div className="mx-auto max-w-4xl">

        {/* 💰 Balance */}
        <div className="rounded-2xl bg-[#7a2848] text-white p-6 shadow-lg">
          <h2 className="text-lg">Wallet Balance</h2>
          <p className="text-3xl font-bold mt-2">
            ₹{balance.toFixed(2)}
          </p>
        </div>

        {/* 📜 Transactions */}
        <div className="mt-6 rounded-2xl bg-white p-4 shadow">
          <h3 className="text-xl font-bold mb-4">Transaction History</h3>

          {loading ? (
            <p>Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500 text-center">
              No transactions yet 💸
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center border p-3 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">
                      {tx.note || "Wallet Transaction"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>

                  <div
                    className={`font-bold ${
                      tx.type === "credit"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}