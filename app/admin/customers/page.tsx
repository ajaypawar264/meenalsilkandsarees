"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Customer = {
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const map = new Map<string, Customer>();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();

        const name = data.customerName || "Unknown";
        const phone = data.phone || "N/A";
        const address = data.address || "";
        const amount = Number(data.totalAmount || 0);

        const key = phone; // unique by phone

        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.totalOrders += 1;
          existing.totalSpent += amount;
        } else {
          map.set(key, {
            name,
            phone,
            address,
            totalOrders: 1,
            totalSpent: amount,
          });
        }
      });

      setCustomers(Array.from(map.values()));
    } catch (err) {
      console.error("Customer fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    });
  }, [customers, search]);

  return (
    <main className="min-h-screen bg-[#fff8f3] p-4 md:p-8 text-[#3b1f1f]">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold text-[#7a2848] mb-6">
          Customers
        </h1>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:max-w-md rounded-xl border px-4 py-3 outline-none"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-[#fff0f3]">
              <tr className="text-left">
                <th className="p-4">Name</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Address</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Total Spent</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-4 font-medium">{c.name}</td>
                    <td className="p-4">{c.phone}</td>
                    <td className="p-4">{c.address}</td>
                    <td className="p-4">{c.totalOrders}</td>
                    <td className="p-4 font-semibold">
                      ₹{c.totalSpent.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}