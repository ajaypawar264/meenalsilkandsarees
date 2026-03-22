import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
};

export type PaymentMethod = "COD" | "ONLINE";

export async function placeOrder(
  customerName: string,
  phone: string,
  address: string,
  items: OrderItem[],
  totalAmount: number,
  paymentMethod: PaymentMethod
) {
  const cleanName = customerName.trim();
  const cleanPhone = phone.trim();
  const cleanAddress = address.trim();

  if (!cleanName || !cleanPhone || !cleanAddress) {
    throw new Error("Customer details are required");
  }

  if (!/^\d{10}$/.test(cleanPhone)) {
    throw new Error("Please enter a valid 10-digit phone number");
  }

  if (!items || items.length === 0) {
    throw new Error("No items selected");
  }

  if (totalAmount <= 0) {
    throw new Error("Invalid total amount");
  }

  const normalizedItems = items.map((item) => ({
    id: String(item.id || "").trim(),
    name: String(item.name || "").trim(),
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 0),
    imageUrl: item.imageUrl || "",
  }));

  const hasInvalidItem = normalizedItems.some(
    (item) =>
      !item.id || !item.name || item.price <= 0 || item.quantity <= 0
  );

  if (hasInvalidItem) {
    throw new Error("Invalid order items");
  }

  const orderRef = doc(collection(db, "orders"));

  await runTransaction(db, async (transaction) => {
    for (const item of normalizedItems) {
      const productRef = doc(db, "products", item.id);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists()) {
        throw new Error(`Product not found: ${item.name}`);
      }

      const productData = productSnap.data();
      const currentStock = Number(productData.stock || 0);
      const currentSold = Number(productData.sold || 0);
      const orderQty = Number(item.quantity || 0);

      if (currentStock < orderQty) {
        throw new Error(`Not enough stock for ${item.name}`);
      }

      const newStock = currentStock - orderQty;
      const newSold = currentSold + orderQty;

      transaction.update(productRef, {
        stock: newStock,
        sold: newSold,
        inStock: newStock > 0,
      });
    }

    transaction.set(orderRef, {
      customerName: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      items: normalizedItems,
      totalAmount: Number(totalAmount),
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Unpaid",
      status: "Pending",
      createdAt: serverTimestamp(),

      // delivery + return fields
      estimatedDeliveryDate: null,
      deliveredAt: null,
      returnEligibleTill: null,
      returnStatus: "Not Requested",
      returnRequestedAt: null,
      returnApprovedAt: null,
      returnRejectedAt: null,
    });
  });

  return orderRef.id;
}