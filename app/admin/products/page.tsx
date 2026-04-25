"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
type Variant = {
  color: string;
  stock: number;
  imageUrl?: string;
};

type Product = {
  id: string;
   name?: string;        // optional kar
  baseName?: string;
 
  price: number;
  stock?: number;
  sold?: number;
  category?: string;
  subCategory?: string; // ✅ added
  color?: string;
  colors?: Variant[]; 
  imageUrl?: string;
mediaFiles?: { url: string; type?: string }[];
  description?: string;
  inStock?: boolean;
};

export default function AdminProductsPage() {
  const [variantStocks, setVariantStocks] = useState<
  Record<string, Record<number, number>>
>({});
  const [search, setSearch] = useState("");
const [stockTab, setStockTab] = useState<"all" | "in" | "out">("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [imageFileMap, setImageFileMap] = useState<Record<string, File>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({});
  const filteredProducts = products.filter((p) => {
  const name = p.name?.toLowerCase() || "";
  const matchSearch = name.includes(search.toLowerCase());

  const isInStock = (p.stock ?? 0) > 0;

  const matchStock =
    stockTab === "all"
      ? true
      : stockTab === "in"
      ? isInStock
      : !isInStock;

  return matchSearch && matchStock;
});

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const data: Product[] = snap.docs.map((docItem) => ({
        id: docItem.id,
        ...(docItem.data() as Omit<Product, "id">),
      }));

      setProducts(data);
    } catch (error) {
      console.error(error);
      alert("Products load zhale nahi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageChange = async (
    productId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Fakt image file select kar");
        return;
      }

      setImageFileMap((prev) => ({
        ...prev,
        [productId]: file,
      }));

      const localPreview = URL.createObjectURL(file);

      setPreviewMap((prev) => ({
        ...prev,
        [productId]: localPreview,
      }));
    } catch (error) {
      console.error(error);
      alert("Image select zala nahi");
    }
  };

  const uploadImageAndGetUrl = async (productId: string, file: File) => {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `products/${productId}/${fileName}`);

    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  };

  const handleUpdate = async (productId: string) => {
    try {
      setSavingId(productId);

      const stockInput = document.getElementById(
        `stock-${productId}`
      ) as HTMLInputElement | null
      
;
      const priceInput = document.getElementById(
        `price-${productId}`
      ) as HTMLInputElement | null;

      const colorInput = document.getElementById(
        `color-${productId}`
      ) as HTMLInputElement | null;

      const nameInput = document.getElementById(
        `name-${productId}`
      ) as HTMLInputElement | null;

      const descInput = document.getElementById(
        `desc-${productId}`
      ) as HTMLTextAreaElement | null;
      

      const subCategoryInput = document.getElementById(
        `subCategory-${productId}`
      ) as HTMLInputElement | null;
      const product = products.find((p) => p.id === productId);
if (!product) {
  alert("Product not found");
  return;
}

      const newStock = Number(stockInput?.value || 0);
      const newPrice = Number(priceInput?.value || 0);
      const newColor = colorInput?.value?.trim() || "";
      const newName = nameInput?.value?.trim() || "";
      const newDesc = descInput?.value?.trim() || "";
      const newSubCategory = subCategoryInput?.value?.trim() || "";

      if (newPrice <= 0) {
        alert("Price valid tak");
        return;
      }

      if (newStock < 0) {
        alert("Stock negative nasava");
        return;
      }
const updatedColors =
  product.colors?.map((c, idx) => ({
    ...c,
    stock:
      variantStocks[product.id]?.[idx] !== undefined
        ? variantStocks[product.id][idx]
        : c.stock,
  })) || [];
      const updateData: any = {
  stock: newStock,
  
  price: newPrice,
  color: newColor,
  name: newName,
  description: newDesc,
  subCategory: newSubCategory,
  inStock: newStock > 0,
  colors: updatedColors, // 🔥 THIS LINE WAS MISSING
};
      const selectedFile = imageFileMap[productId];

      if (selectedFile) {
        const uploadedImageUrl = await uploadImageAndGetUrl(
          productId,
          selectedFile
        );
        updateData.imageUrl = uploadedImageUrl;
      }

      await updateDoc(doc(db, "products", productId), updateData);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? {
                ...p,
                stock: newStock,
                price: newPrice,
                color: newColor,
                name: newName,
                description: newDesc,
                subCategory: newSubCategory, // ✅ added
                inStock: newStock > 0,
                imageUrl: updateData.imageUrl || p.imageUrl,
              }
            : p
        )
      );

      setImageFileMap((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });

      setPreviewMap((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });

      alert("Product update jhala");
    } catch (error) {
      console.error(error);
      alert("Update zala nahi");
    } finally {
      setSavingId("");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#12090f] to-[#1a0d10] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-yellow-400">
              Admin
            </p>
            <h1 className="text-3xl font-bold">Stock Management</h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/orders"
              className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-cyan-300"
            >
              Orders
            </Link>
            <Link
              href="/admin/gallery"
              className="rounded-xl border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-purple-300"
            >
              Gallery
            </Link>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

  {/* SEARCH */}
  <input
    type="text"
    placeholder="Search product..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full md:w-[300px] rounded-xl border border-white/20 bg-black px-4 py-2 text-white"
  />

  {/* STOCK FILTER TABS */}
  <div className="flex gap-2">
    <button
      onClick={() => setStockTab("all")}
      className={`px-4 py-2 rounded-xl ${
        stockTab === "all"
          ? "bg-yellow-500 text-black"
          : "bg-white/10"
      }`}
    >
      All
    </button>

    <button
      onClick={() => setStockTab("in")}
      className={`px-4 py-2 rounded-xl ${
        stockTab === "in"
          ? "bg-green-500 text-black"
          : "bg-white/10"
      }`}
    >
      In Stock
    </button>

    <button
      onClick={() => setStockTab("out")}
      className={`px-4 py-2 rounded-xl ${
        stockTab === "out"
          ? "bg-red-500 text-black"
          : "bg-white/10"
      }`}
    >
      Out of Stock
    </button>
  </div>
</div>

        {loading ? (
          <p className="text-white/70">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            No products found
          </div>
        ) :
         (
          <div className="space-y-4">
           {filteredProducts.map((product) => {
  console.log("PRODUCT:", product);
  console.log("MEDIA:", product.mediaFiles);

  const previewImage =
  previewMap[product.id] ||
  product.mediaFiles?.[0]?.url ||
  product.imageUrl ||
  (product as any).colors?.[0]?.imageUrl ||
  "";


    
              return (
                <div
                  key={product.id}
                  className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl md:grid-cols-[140px_1fr_auto]"
                >
                  <div>
                 {previewImage ? (
  <img
    src={previewImage + "?tr=f-jpg"}
    alt={product.name}
    className="h-28 w-28 rounded-2xl object-cover"
    onError={(e) => {
      (e.target as HTMLImageElement).style.display = "none";
    }}
  />
) : (
  <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white/10 text-white/50">
    No Image
  </div>
)}

                    <label className="mt-3 block text-xs text-white/70">
                      Upload Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(product.id, e)}
                      className="mt-2 block w-full text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-yellow-500 file:px-3 file:py-2 file:font-semibold file:text-black"
                    />
                  </div>

                  <div>
                   <h2 className="text-xl font-bold text-yellow-400">
  {product.name || product.baseName || "Unnamed"}
</h2>

                    <p className="mt-1 text-white/70">
                      {product.description}
                    </p>

                    <p className="mt-1 text-white/70">
                      {product.category}
                    </p>

                    <p className="mt-1 text-white/70">
                      SubCategory: {product.subCategory || "-"}
                    </p>

                    <p className="mt-1 text-white/70">
                      Color: {product.color || "-"}
                    </p>

                    <p className="mt-1 text-sm text-white/60">
                      Sold: {product.sold ?? 0}
                    </p>

                    <p className="mt-1 text-sm text-white/60">
                      Product ID: {product.id}
                    </p>
                  </div>

                  <div className="grid gap-3 md:min-w-[280px]">
                    <div>
                      <label className="mb-1 block text-sm text-white/60">
                        Product Name
                      </label>
                      <input
                        id={`name-${product.id}`}
                        type="text"
                        defaultValue={product.name}
                        className="w-full rounded-xl border border-white/20 bg-black px-4 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-white/60">
                        Description
                      </label>
                      <textarea
                        id={`desc-${product.id}`}
                        defaultValue={product.description || ""}
                        className="w-full rounded-xl border border-white/20 bg-black px-4 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-white/60">
                        Sub Category
                      </label>
                      <input
                        id={`subCategory-${product.id}`}
                        type="text"
                        defaultValue={product.subCategory || ""}
                        className="w-full rounded-xl border border-white/20 bg-black px-4 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-white/60">
                        Price
                      </label>
                      <input
                        id={`price-${product.id}`}
                        type="number"
                        defaultValue={product.price}
                        className="w-full rounded-xl border border-white/20 bg-black px-4 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-white/60">
                        Stock
                      </label>
                      <input
                        id={`stock-${product.id}`}
                        type="number"
                        defaultValue={product.stock ?? 0}
                        className="w-full rounded-xl border border-white/20 bg-black px-4 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-white/60">
                        Color
                      </label>
                      <input
                        id={`color-${product.id}`}
                        type="text"
                        defaultValue={product.color || ""}
                        className="w-full rounded-xl border border-white/20 bg-black px-4 py-2 text-white"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          (product.stock ?? 0) > 0
                            ? "bg-green-500/20 text-green-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {(product.stock ?? 0) > 0
                          ? "In Stock"
                          : "Out of Stock"}
                      </span>

                      <button
                        onClick={() => handleUpdate(product.id)}
                        disabled={savingId === product.id}
                        className="rounded-xl bg-yellow-500 px-4 py-2 font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
                      >
                        {savingId === product.id
                          ? "Saving..."
                          : "Update"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}