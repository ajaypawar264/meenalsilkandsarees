import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getNextOrderId() {
  const ref = doc(db, "counters", "orders");

  const id = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    const current = snap.exists() ? snap.data().value : 1000;
    const next = current + 1;

    tx.set(ref, { value: next }, { merge: true });

    return next;
  });

  return `MEENAL-${id}`;
}

export async function getNextInvoiceNo() {   // 👈 नाव IMPORTANT
  const ref = doc(db, "counters", "invoice");

  const id = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    const current = snap.exists() ? snap.data().value : 5000;
    const next = current + 1;

    tx.set(ref, { value: next }, { merge: true });

    return next;
  });

  return `INV-${id}`;
}