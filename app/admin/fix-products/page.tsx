"use client";

import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function FixProductsPage() {
  const fixProducts = async () => {
    try {
      const snap = await getDocs(collection(db, "products"));

      for (const d of snap.docs) {
        const data: any = d.data();

        // skip new format
        if (data.colors && data.colors.length > 0) continue;

        if (data.color && data.mediaFiles?.length > 0) {
          const newColors = [
            {
              color: data.color,
              imageUrl: data.mediaFiles[0]?.url || "",
              mediaFiles: data.mediaFiles,
            },
          ];

          await updateDoc(doc(db, "products", d.id), {
            colors: newColors,
          });

          console.log("Updated:", d.id);
        }
      }

      alert("Migration Done ✅");
    } catch (err) {
      console.error(err);
      alert("Error running migration");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-6">
        Fix Old Products (Color Migration)
      </h1>

      <button
        onClick={fixProducts}
        className="bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold"
      >
        Run Migration
      </button>
    </main>
  );
}