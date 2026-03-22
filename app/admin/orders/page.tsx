"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty?: number;
  quantity?: number;
  imageUrl?: string;
};

type OrderStatus = "Pending" | "Processing" | "Delivered" | "Cancelled";

type Order = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: "COD" | "ONLINE";
  paymentStatus?: "Pending" | "Unpaid" | "Paid";
  createdAt?: any;
  items: OrderItem[];
  orderNumber?: string;
};

const SHOP_DETAILS = {
  name: "Minal Silk And Saree",
  address: "Pune, Maharashtra, India",
  phone: "+91 00000 00000",
  gstin: "27ABCDE1234F1Z5",
  state: "Maharashtra",
  stateCode: "27",
};

const GST_PERCENT = 5;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<"All" | OrderStatus>("All");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [billOrder, setBillOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Order, "id">),
      }));

      setOrders(data);
    } catch (error) {
      console.error("Orders fetch error:", error);
      alert("Orders fetch kartana error ala.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const counts = useMemo(() => {
    return {
      all: orders.length,
      pending: orders.filter((o) => o.status === "Pending").length,
      processing: orders.filter((o) => o.status === "Processing").length,
      delivered: orders.filter((o) => o.status === "Delivered").length,
      cancelled: orders.filter((o) => o.status === "Cancelled").length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        selectedStatus === "All" ? true : order.status === selectedStatus;

      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        (order.customerName || "").toLowerCase().includes(q) ||
        (order.phone || "").toLowerCase().includes(q) ||
        (order.address || "").toLowerCase().includes(q) ||
        (order.id || "").toLowerCase().includes(q) ||
        (order.orderNumber || "").toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, search]);

  const getQty = (item: OrderItem) => item.qty || item.quantity || 1;

  const getOrderDate = (createdAt: any) => {
    try {
      if (!createdAt) return "-";
      if (createdAt?.toDate) {
        return createdAt.toDate().toLocaleString("en-IN");
      }
      return new Date(createdAt).toLocaleString("en-IN");
    } catch {
      return "-";
    }
  };

  const getBillData = (order: Order) => {
    const items = order.items || [];

    const taxableAmount = items.reduce((sum, item) => {
      return sum + Number(item.price || 0) * getQty(item);
    }, 0);

    const gstAmount = (taxableAmount * GST_PERCENT) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;
    const grandTotal = taxableAmount + gstAmount;

    return {
      taxableAmount,
      gstAmount,
      cgst,
      sgst,
      grandTotal,
    };
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: serverTimestamp(),
      });

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status } : order
        )
      );

      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status } : prev));
      }

      if (billOrder?.id === orderId) {
        setBillOrder((prev) => (prev ? { ...prev, status } : prev));
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("Order status update zala nahi.");
    }
  };

  const handlePrintBill = (order: Order) => {
    setBillOrder(order);

    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <main className="min-h-screen bg-[#fff8f3] text-[#3b1f1f] p-4 md:p-8">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          #print-bill-area,
          #print-bill-area * {
            visibility: visible !important;
          }

          #print-bill-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="no-print mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[#7a2848]">
            Order Management
          </h1>
          <p className="mt-2 text-sm md:text-base text-[#6b4a4a]">
            Orders manage kara, status update kara, bill bagha ani print kara.
          </p>
        </div>

        <div className="no-print grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setSelectedStatus("All")}
            className={`rounded-2xl border p-4 text-left shadow-sm transition ${
              selectedStatus === "All"
                ? "bg-[#7a2848] text-white border-[#7a2848]"
                : "bg-white border-[#ead7d7] hover:border-[#7a2848]"
            }`}
          >
            <p className="text-sm">All Orders</p>
            <p className="mt-1 text-2xl font-bold">{counts.all}</p>
          </button>

          <button
            onClick={() => setSelectedStatus("Pending")}
            className={`rounded-2xl border p-4 text-left shadow-sm transition ${
              selectedStatus === "Pending"
                ? "bg-yellow-500 text-white border-yellow-500"
                : "bg-white border-[#ead7d7] hover:border-yellow-500"
            }`}
          >
            <p className="text-sm">Pending Orders</p>
            <p className="mt-1 text-2xl font-bold">{counts.pending}</p>
          </button>

          <button
            onClick={() => setSelectedStatus("Processing")}
            className={`rounded-2xl border p-4 text-left shadow-sm transition ${
              selectedStatus === "Processing"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-[#ead7d7] hover:border-blue-600"
            }`}
          >
            <p className="text-sm">Processing Orders</p>
            <p className="mt-1 text-2xl font-bold">{counts.processing}</p>
          </button>

          <button
            onClick={() => setSelectedStatus("Delivered")}
            className={`rounded-2xl border p-4 text-left shadow-sm transition ${
              selectedStatus === "Delivered"
                ? "bg-green-600 text-white border-green-600"
                : "bg-white border-[#ead7d7] hover:border-green-600"
            }`}
          >
            <p className="text-sm">Delivered Orders</p>
            <p className="mt-1 text-2xl font-bold">{counts.delivered}</p>
          </button>

          <button
            onClick={() => setSelectedStatus("Cancelled")}
            className={`rounded-2xl border p-4 text-left shadow-sm transition ${
              selectedStatus === "Cancelled"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white border-[#ead7d7] hover:border-red-600"
            }`}
          >
            <p className="text-sm">Cancelled Orders</p>
            <p className="mt-1 text-2xl font-bold">{counts.cancelled}</p>
          </button>
        </div>

        <div className="no-print mb-6 rounded-2xl border border-[#ead7d7] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              placeholder="Search by customer name, phone, order id..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#d9bcbc] px-4 py-3 outline-none focus:border-[#7a2848] md:max-w-md"
            />

            <div className="text-sm text-[#6b4a4a]">
              Showing <span className="font-bold">{filteredOrders.length}</span> orders
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="no-print overflow-hidden rounded-2xl border border-[#ead7d7] bg-white shadow-sm">
            <div className="overflow-auto">
              <table className="w-full min-w-[980px]">
                <thead className="bg-[#fff0f3]">
                  <tr className="text-left">
                    <th className="p-4 font-semibold">Order ID</th>
                    <th className="p-4 font-semibold">Customer</th>
                    <th className="p-4 font-semibold">Phone</th>
                    <th className="p-4 font-semibold">Amount</th>
                    <th className="p-4 font-semibold">Payment</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center">
                        Loading orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center">
                        Orders nahi ahet.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-t border-[#f1dfdf] align-top"
                      >
                        <td className="p-4 font-medium">
                          {order.orderNumber || order.id}
                        </td>
                        <td className="p-4">{order.customerName}</td>
                        <td className="p-4">{order.phone}</td>
                        <td className="p-4 font-semibold">
                          ₹{Number(order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <div>{order.paymentMethod || "COD"}</div>
                          <div className="text-xs text-[#7a6a6a]">
                            {order.paymentStatus || "Pending"}
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              updateOrderStatus(order.id, e.target.value as OrderStatus)
                            }
                            className="rounded-lg border border-[#d9bcbc] px-3 py-2 outline-none"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="p-4 text-sm">{getOrderDate(order.createdAt)}</td>
                        <td className="p-4">
                          <div className="flex min-w-[150px] flex-col gap-2">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="rounded-lg bg-[#7a2848] px-3 py-2 text-sm text-white hover:opacity-90"
                            >
                              View Order
                            </button>

                            <button
                              onClick={() => setBillOrder(order)}
                              className="rounded-lg bg-[#b76e79] px-3 py-2 text-sm text-white hover:opacity-90"
                            >
                              View Bill
                            </button>

                            <button
                              onClick={() => handlePrintBill(order)}
                              className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:opacity-90"
                            >
                              Print Bill
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="no-print rounded-2xl border border-[#ead7d7] bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-2xl font-bold text-[#7a2848]">
              Order Details
            </h2>

            {!selectedOrder ? (
              <p className="text-[#6b4a4a]">Left side madhun order select kara.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#f0dadd] bg-[#fff8fb] p-4">
                  <p>
                    <span className="font-semibold">Order ID:</span>{" "}
                    {selectedOrder.orderNumber || selectedOrder.id}
                  </p>
                  <p>
                    <span className="font-semibold">Customer:</span>{" "}
                    {selectedOrder.customerName}
                  </p>
                  <p>
                    <span className="font-semibold">Phone:</span>{" "}
                    {selectedOrder.phone}
                  </p>
                  <p>
                    <span className="font-semibold">Address:</span>{" "}
                    {selectedOrder.address}
                  </p>
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    {selectedOrder.status}
                  </p>
                  <p>
                    <span className="font-semibold">Payment Method:</span>{" "}
                    {selectedOrder.paymentMethod || "COD"}
                  </p>
                  <p>
                    <span className="font-semibold">Payment Status:</span>{" "}
                    {selectedOrder.paymentStatus || "Pending"}
                  </p>
                  <p>
                    <span className="font-semibold">Date:</span>{" "}
                    {getOrderDate(selectedOrder.createdAt)}
                  </p>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-bold">Items</h3>

                  <div className="space-y-3">
                    {(selectedOrder.items || []).map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#efdede] p-3"
                      >
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-14 w-14 rounded-lg border object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#f4ecec] text-xs">
                              No Img
                            </div>
                          )}

                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-[#6b4a4a]">
                              ₹{Number(item.price || 0).toFixed(2)} × {getQty(item)}
                            </p>
                          </div>
                        </div>

                        <div className="font-semibold">
                          ₹{(Number(item.price || 0) * getQty(item)).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#f0dadd] bg-[#fff8fb] p-4">
                  <p className="text-lg font-bold">
                    Total: ₹{Number(selectedOrder.totalAmount || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {billOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
                <h2 className="text-2xl font-bold text-[#7a2848]">GST Bill View</h2>

                <div className="flex gap-3">
                  <button
                    onClick={() => handlePrintBill(billOrder)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-white hover:opacity-90"
                  >
                    Print Bill
                  </button>
                  <button
                    onClick={() => setBillOrder(null)}
                    className="rounded-lg bg-gray-700 px-4 py-2 text-white hover:opacity-90"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div id="print-bill-area" className="p-6">
                {(() => {
                  const { taxableAmount, cgst, sgst, grandTotal } =
                    getBillData(billOrder);

                  return (
                    <div className="mx-auto max-w-4xl text-black">
                      <div className="mb-4 border-b-2 border-black pb-4">
                        <div className="flex justify-between gap-6">
                          <div>
                            <h2 className="text-3xl font-bold">{SHOP_DETAILS.name}</h2>
                            <p>{SHOP_DETAILS.address}</p>
                            <p>Phone: {SHOP_DETAILS.phone}</p>
                            <p>GSTIN: {SHOP_DETAILS.gstin}</p>
                            <p>
                              State: {SHOP_DETAILS.state} ({SHOP_DETAILS.stateCode})
                            </p>
                          </div>

                          <div className="text-right">
                            <h3 className="text-2xl font-bold">TAX INVOICE</h3>
                            <p>
                              Invoice No: INV-
                              {(billOrder.orderNumber || billOrder.id.slice(0, 8)).toUpperCase()}
                            </p>
                            <p>Order ID: {billOrder.orderNumber || billOrder.id}</p>
                            <p>Date: {getOrderDate(billOrder.createdAt)}</p>
                            <p>Status: {billOrder.status}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6 grid gap-6 md:grid-cols-2">
                        <div className="border border-black p-4">
                          <h4 className="mb-2 font-bold">Bill To</h4>
                          <p>
                            <strong>Name:</strong> {billOrder.customerName}
                          </p>
                          <p>
                            <strong>Phone:</strong> {billOrder.phone}
                          </p>
                          <p>
                            <strong>Address:</strong> {billOrder.address}
                          </p>
                        </div>

                        <div className="border border-black p-4">
                          <h4 className="mb-2 font-bold">Payment Details</h4>
                          <p>
                            <strong>Payment Method:</strong>{" "}
                            {billOrder.paymentMethod || "COD"}
                          </p>
                          <p>
                            <strong>Payment Status:</strong>{" "}
                            {billOrder.paymentStatus || "Pending"}
                          </p>
                          <p>
                            <strong>Supply State:</strong> {SHOP_DETAILS.state}
                          </p>
                        </div>
                      </div>

                      <table className="mb-6 w-full border-collapse border border-black">
                        <thead>
                          <tr>
                            <th className="border border-black p-2 text-left">#</th>
                            <th className="border border-black p-2 text-left">Item</th>
                            <th className="border border-black p-2 text-right">Price</th>
                            <th className="border border-black p-2 text-right">Qty</th>
                            <th className="border border-black p-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(billOrder.items || []).map((item, index) => (
                            <tr key={`${item.id}-${index}`}>
                              <td className="border border-black p-2">{index + 1}</td>
                              <td className="border border-black p-2">{item.name}</td>
                              <td className="border border-black p-2 text-right">
                                ₹{Number(item.price || 0).toFixed(2)}
                              </td>
                              <td className="border border-black p-2 text-right">
                                {getQty(item)}
                              </td>
                              <td className="border border-black p-2 text-right">
                                ₹{(Number(item.price || 0) * getQty(item)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="mb-6 flex justify-end">
                        <div className="w-full max-w-md">
                          <div className="flex justify-between border border-black border-b-0 p-2">
                            <span>Taxable Amount</span>
                            <span>₹{taxableAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border border-black border-b-0 p-2">
                            <span>CGST ({GST_PERCENT / 2}%)</span>
                            <span>₹{cgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border border-black border-b-0 p-2">
                            <span>SGST ({GST_PERCENT / 2}%)</span>
                            <span>₹{sgst.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border border-black p-2 text-lg font-bold">
                            <span>Grand Total</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 grid gap-6 md:grid-cols-2">
                        <div>
                          <p className="mb-2 font-semibold">Declaration</p>
                          <p className="text-sm">
                            We declare that this invoice shows the actual price of
                            the goods described and that all particulars are true and
                            correct.
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="mb-10 font-semibold">
                            For {SHOP_DETAILS.name}
                          </p>
                          <p>Authorised Signatory</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}