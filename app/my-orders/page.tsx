"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  Timestamp,
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

type ReturnStatus =
  | "Not Requested"
  | "Requested"
  | "Approved"
  | "Rejected";

type Order = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  totalAmount: number;
  status: "Pending" | "Processing" | "Delivered" | "Cancelled";
  paymentMethod?: "COD" | "ONLINE";
  paymentStatus?: "Pending" | "Unpaid" | "Paid";
  createdAt?: any;
  estimatedDeliveryDate?: any;
  deliveredAt?: any;
  returnEligibleTill?: any;
  returnStatus?: ReturnStatus;
  returnRequestedAt?: any;
  items: OrderItem[];
};

const GST_RATE = 0.05; // 5% GST

function toDate(value: any): Date | null {
  if (!value) return null;

  if (value instanceof Date) return value;

  if (value instanceof Timestamp) return value.toDate();

  if (typeof value?.toDate === "function") return value.toDate();

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

function formatDateTime(value: any) {
  const date = toDate(value);
  if (!date) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

function getItemQty(item: OrderItem) {
  return item.qty ?? item.quantity ?? 1;
}

function calculateSubTotal(items: OrderItem[]) {
  return items.reduce((sum, item) => {
    return sum + Number(item.price || 0) * getItemQty(item);
  }, 0);
}

function calculateGST(subtotal: number) {
  return subtotal * GST_RATE;
}

function getInvoiceNumber(order: Order) {
  return `MS-${order.id.slice(0, 8).toUpperCase()}`;
}

export default function MyOrdersPage() {
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [userName, setUserName] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingReturnId, setRequestingReturnId] = useState("");
  const [openInvoiceId, setOpenInvoiceId] = useState("");

  useEffect(() => {
    const savedPhone = localStorage.getItem("user_mobile") || "";
    const savedName = localStorage.getItem("user_name") || "";
    const savedUserId = localStorage.getItem("user_id") || "";

    if (!savedUserId || !savedPhone) {
      router.push("/login");
      return;
    }

    setPhone(savedPhone);
    setUserName(savedName);
    fetchOrders(savedPhone);
  }, [router]);

  const fetchOrders = async (userPhone: string) => {
    try {
      setLoading(true);

      const q = query(
        collection(db, "orders"),
        where("phone", "==", userPhone.trim()),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      const list: Order[] = snap.docs.map((docItem) => ({
        id: docItem.id,
        ...(docItem.data() as Omit<Order, "id">),
      }));

      setOrders(list);
    } catch (error) {
      console.error("Error fetching user orders:", error);
      alert("Unable to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const canRequestReturn = (order: Order) => {
    if (order.status !== "Delivered") return false;
    if ((order.returnStatus || "Not Requested") !== "Not Requested") return false;

    const eligibleTill = toDate(order.returnEligibleTill);
    if (!eligibleTill) return false;

    return eligibleTill.getTime() >= Date.now();
  };

  const handleReturnRequest = async (orderId: string) => {
    try {
      setRequestingReturnId(orderId);

      await updateDoc(doc(db, "orders", orderId), {
        returnStatus: "Requested",
        returnRequestedAt: new Date(),
      });

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                returnStatus: "Requested",
                returnRequestedAt: new Date(),
              }
            : order
        )
      );
    } catch (error) {
      console.error("Return request failed:", error);
      alert("Return request failed");
    } finally {
      setRequestingReturnId("");
    }
  };

  const handlePrintInvoice = (orderId: string) => {
    const printContents = document.getElementById(`invoice-${orderId}`)?.innerHTML;
    if (!printContents) return;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111;
            }
            h1, h2, h3, p {
              margin: 0 0 10px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 10px;
              text-align: left;
              font-size: 14px;
            }
            th {
              background: #f5f5f5;
            }
            .top {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              margin-bottom: 24px;
            }
            .box {
              margin-top: 20px;
            }
            .totals {
              margin-top: 20px;
              width: 320px;
              margin-left: auto;
            }
            .totals div {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
            }
            .grand {
              font-weight: 700;
              font-size: 16px;
              border-top: 2px solid #111;
              margin-top: 8px;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          ${printContents}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#12090f] to-[#1a0d10] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-400">
              Minal Silk
            </p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">My Orders</h1>
            <p className="mt-2 text-white/60">
              {userName ? `${userName}` : "Customer"} • {phone}
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 transition hover:bg-white/20"
          >
            Back to Shop
          </Link>
        </header>

        <div className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
              No orders found for your account.
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const subTotal = calculateSubTotal(order.items || []);
                const gstAmount = calculateGST(subTotal);
                const cgst = gstAmount / 2;
                const sgst = gstAmount / 2;
                const grandTotal = subTotal + gstAmount;

                return (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-yellow-400">
                          {order.customerName}
                        </h2>
                        <p className="mt-2 text-white/80">Phone: {order.phone}</p>
                        <p className="mt-1 text-white/80">
                          Address: {order.address}
                        </p>
                        <p className="mt-1 text-white/80">
                          Total: {formatCurrency(order.totalAmount || grandTotal)}
                        </p>

                        <div className="mt-4 grid gap-2 text-sm text-white/70">
                          <p>Order Date: {formatDateTime(order.createdAt)}</p>
                          <p>
                            Estimated Delivery:{" "}
                            {formatDateTime(order.estimatedDeliveryDate)}
                          </p>
                          <p>Delivered At: {formatDateTime(order.deliveredAt)}</p>
                          <p>
                            Return Eligible Till:{" "}
                            {formatDateTime(order.returnEligibleTill)}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
                            Payment: {order.paymentMethod || "COD"}
                          </span>

                          <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-medium text-purple-300">
                            Payment Status: {order.paymentStatus || "Pending"}
                          </span>

                          {order.status === "Delivered" && (
                            <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
                              7 Days Return
                            </span>
                          )}

                          <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-300">
                            Return: {order.returnStatus || "Not Requested"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 md:items-end">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            order.status === "Delivered"
                              ? "bg-green-500/20 text-green-300"
                              : order.status === "Cancelled"
                              ? "bg-red-500/20 text-red-300"
                              : order.status === "Processing"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {order.status}
                        </span>

                        {(order.returnStatus || "Not Requested") === "Requested" && (
                          <span className="rounded-full bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-300">
                            Return Requested
                          </span>
                        )}

                        {(order.returnStatus || "Not Requested") === "Approved" && (
                          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
                            Return Approved
                          </span>
                        )}

                        {(order.returnStatus || "Not Requested") === "Rejected" && (
                          <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300">
                            Return Rejected
                          </span>
                        )}

                        {canRequestReturn(order) && (
                          <button
                            type="button"
                            onClick={() => handleReturnRequest(order.id)}
                            disabled={requestingReturnId === order.id}
                            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-60"
                          >
                            {requestingReturnId === order.id
                              ? "Requesting..."
                              : "Request Return"}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setOpenInvoiceId((prev) =>
                              prev === order.id ? "" : order.id
                            )
                          }
                          className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                          {openInvoiceId === order.id ? "Hide Bill" : "View Bill"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePrintInvoice(order.id)}
                          className="rounded-xl bg-gradient-to-r from-[#b88639] to-[#e2b45b] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110"
                        >
                          Print Bill
                        </button>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="mb-4 text-lg font-semibold text-white">
                        Ordered Products
                      </h3>

                      <div className="grid gap-4 md:grid-cols-2">
                        {order.items?.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/30 p-4"
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-20 w-20 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/10 text-white/50">
                                No Image
                              </div>
                            )}

                            <div>
                              <h4 className="font-semibold text-white">
                                {item.name}
                              </h4>
                              <p className="text-sm text-white/70">
                                Price: {formatCurrency(item.price)}
                              </p>
                              <p className="text-sm text-white/70">
                                Qty: {getItemQty(item)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.returnRequestedAt && (
                      <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-4 text-sm text-orange-200">
                        Return Requested At: {formatDateTime(order.returnRequestedAt)}
                      </div>
                    )}

                    {openInvoiceId === order.id && (
                      <div className="mt-6 rounded-3xl border border-white/10 bg-white p-6 text-black shadow-xl">
                        <div id={`invoice-${order.id}`}>
                          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                            <div>
                              <h2 className="text-2xl font-bold">Meenal Silk & Saree</h2>
                              <p className="mt-2 text-sm text-slate-600">
                                Main Road, Pune, Maharashtra
                              </p>
                              <p className="text-sm text-slate-600">
                                Phone: +91 9876543210
                              </p>
                              <p className="text-sm text-slate-600">
                                Email: meenalsilkstore@gmail.com
                              </p>
                              <p className="text-sm text-slate-600">
                                GSTIN: 27ABCDE1234F1Z5
                              </p>
                            </div>

                            <div className="text-left md:text-right">
                              <h3 className="text-xl font-bold">TAX INVOICE</h3>
                              <p className="mt-2 text-sm text-slate-700">
                                Invoice No: {getInvoiceNumber(order)}
                              </p>
                              <p className="text-sm text-slate-700">
                                Order ID: {order.id}
                              </p>
                              <p className="text-sm text-slate-700">
                                Date: {formatDateTime(order.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 p-4">
                              <p className="text-sm font-semibold text-slate-500">
                                Bill To
                              </p>
                              <p className="mt-2 font-semibold">{order.customerName}</p>
                              <p className="text-sm text-slate-700">{order.phone}</p>
                              <p className="text-sm text-slate-700">{order.address}</p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-4">
                              <p className="text-sm font-semibold text-slate-500">
                                Payment Details
                              </p>
                              <p className="mt-2 text-sm text-slate-700">
                                Method: {order.paymentMethod || "COD"}
                              </p>
                              <p className="text-sm text-slate-700">
                                Status: {order.paymentStatus || "Pending"}
                              </p>
                              <p className="text-sm text-slate-700">
                                Order Status: {order.status}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 overflow-x-auto">
                            <table className="w-full border-collapse overflow-hidden rounded-2xl border border-slate-200">
                              <thead>
                                <tr className="bg-slate-100 text-left">
                                  <th className="px-4 py-3 text-sm font-semibold">Item</th>
                                  <th className="px-4 py-3 text-sm font-semibold">Qty</th>
                                  <th className="px-4 py-3 text-sm font-semibold">Rate</th>
                                  <th className="px-4 py-3 text-sm font-semibold">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items?.map((item, index) => {
                                  const qty = getItemQty(item);
                                  const amount = Number(item.price) * qty;

                                  return (
                                    <tr key={index} className="border-t border-slate-200">
                                      <td className="px-4 py-3 text-sm">{item.name}</td>
                                      <td className="px-4 py-3 text-sm">{qty}</td>
                                      <td className="px-4 py-3 text-sm">
                                        {formatCurrency(Number(item.price))}
                                      </td>
                                      <td className="px-4 py-3 text-sm">
                                        {formatCurrency(amount)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-6 ml-auto max-w-sm rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between py-1 text-sm">
                              <span>Sub Total</span>
                              <span>{formatCurrency(subTotal)}</span>
                            </div>
                            <div className="flex items-center justify-between py-1 text-sm">
                              <span>CGST ({(GST_RATE * 50).toFixed(1)}%)</span>
                              <span>{formatCurrency(cgst)}</span>
                            </div>
                            <div className="flex items-center justify-between py-1 text-sm">
                              <span>SGST ({(GST_RATE * 50).toFixed(1)}%)</span>
                              <span>{formatCurrency(sgst)}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-slate-300 pt-3 text-base font-bold">
                              <span>Grand Total</span>
                              <span>{formatCurrency(grandTotal)}</span>
                            </div>
                          </div>

                          <div className="mt-6 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                            <p className="font-semibold">Declaration</p>
                            <p className="mt-2">
                              We declare that this invoice shows the actual price of
                              the goods described and that all particulars are true
                              and correct.
                            </p>
                          </div>

                          <div className="mt-6 flex items-end justify-between">
                            <div className="text-sm text-slate-600">
                              Thank you for shopping with us.
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Authorized Signatory</p>
                              <p className="mt-8 font-semibold">Meenal Silk & Saree</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}