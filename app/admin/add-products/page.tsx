"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  uploadFileToImageKit,
  type UploadedMediaItem,
} from "@/lib/imagekitUpload";

type ProductForm = {
  name: string;
  price: string;
  stock: string;
  category: string;
  subCategory: string;
  newSubCategory: string; // 🔥 ADD
  newCategory: string;
  color: string;
  imageUrl: string;
  inStock: boolean;
};

export default function AddProductsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [mediaPreview, setMediaPreview] = useState<UploadedMediaItem[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMediaItem[]>([]);

  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    price: "",
    stock: "",
    category: "",
    subCategory: "",
    newSubCategory:"",
    newCategory: "",
    color: "",
    imageUrl: "",
    inStock: true,
  });

  const handleChange = (field: keyof ProductForm, value: any) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ FETCH CATEGORIES
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const snap = await getDocs(collection(db, "categories"));

        console.log("RAW SNAP:", snap.docs);

        const data = snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name?.trim(),
            subCategories: d.subCategories || [],
          };
        });

        console.log("CATEGORIES:", data);

        setCategories(data);
      } catch (err) {
        console.error("Category fetch error:", err);
      }
    };

    loadCategories();
  }, []);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    try {
      setUploadingImage(true);

      const uploaded: UploadedMediaItem[] = [];

      for (const file of files) {
        const res = await uploadFileToImageKit(file);
        uploaded.push(res);
      }

      setUploadedMedia((prev) => [...prev, ...uploaded]);
      setMediaPreview((prev) => [...prev, ...uploaded]);

      handleChange("imageUrl", uploaded[0]?.url || "");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.name || !productForm.price) {
      alert("Name ani price required ahe");
      return;
    }

    try {
      setAddingProduct(true);
let finalCategory = productForm.category;
let finalSubCategory = productForm.subCategory;

// ✅ CATEGORY
if (productForm.category === "Other") {
  if (!productForm.newCategory) {
    alert("Enter new category");
    return;
  }

  finalCategory = productForm.newCategory;

  await addDoc(collection(db, "categories"), {
    name: productForm.newCategory,
    subCategories: [],
  });
}

// ✅ SUBCATEGORY
if (productForm.subCategory === "Other") {
  if (!productForm.newSubCategory) {
    alert("Enter new subcategory");
    return;
  }

  finalSubCategory = productForm.newSubCategory;
}

      // ✅ IF OTHER → SAVE CATEGORY TO FIREBASE
      if (productForm.category === "Other") {
        if (!productForm.newCategory) {
          alert("Enter new category");
          return;
        }

        finalCategory = productForm.newCategory;

        await addDoc(collection(db, "categories"), {
          name: productForm.newCategory,
          subCategories: [],
        });
      }

     const { newCategory, newSubCategory, ...rest } = productForm;

await addDoc(collection(db, "products"), {
  ...rest,
  category: finalCategory,
  subCategory: finalSubCategory,
  price: Number(productForm.price),
  stock: Number(productForm.stock || 0),
  mediaFiles: uploadedMedia,
  createdAt: serverTimestamp(),
});

      alert("Product added successfully ✅");

      // RESET
      setProductForm({
        name: "",
        price: "",
        stock: "",
        category: "",
        subCategory: "",
        newCategory: "",
        newSubCategory:"",
        color: "",
        imageUrl: "",
        inStock: true,
      });
      setMediaPreview([]);
      setUploadedMedia([]);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    } finally {
      setAddingProduct(false);
    }
  };

  // ✅ GET SUBCATEGORY
  const selectedCategory = categories.find(
    (cat) => cat.name === productForm.category
  );
  

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Add Products</h1>

      {/* BUTTON */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold"
      >
        {showForm ? "Close Form" : "Add Product"}
      </button>

      {/* FORM */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 max-w-xl bg-white/5 p-6 rounded-2xl"
        >
          <input
            type="text"
            placeholder="Product Name"
            value={productForm.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="p-3 rounded bg-black/30"
          />

          <input
            type="number"
            placeholder="Price"
            value={productForm.price}
            onChange={(e) => handleChange("price", e.target.value)}
            className="p-3 rounded bg-black/30"
          />

          <input
            type="number"
            placeholder="Stock"
            value={productForm.stock}
            onChange={(e) => handleChange("stock", e.target.value)}
            className="p-3 rounded bg-black/30"
          />

          {/* CATEGORY */}
          <select
            value={productForm.category}
            onChange={(e) => {
              handleChange("category", e.target.value);
              handleChange("subCategory", "");
              handleChange("newCategory", "");
            }}
            className="p-3 rounded bg-black/30"
          >
            <option value="">Select Category</option>

            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}

            <option value="Other">Other</option>
          </select>

          {/* NEW CATEGORY */}
          {productForm.category === "Other" && (
            <input
              type="text"
              placeholder="New Category"
              value={productForm.newCategory}
              onChange={(e) =>
                handleChange("newCategory", e.target.value)
              }
              className="p-3 rounded bg-black/30"
            />
          )}

          {/* SUBCATEGORY */}
          <select
            value={productForm.subCategory}
            onChange={(e) => handleChange("subCategory", e.target.value)}
            className="p-3 rounded bg-black/30"
          >
            <option value="">Select SubCategory</option>

            {selectedCategory?.subCategories?.map((sub: string) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}

            <option value="Other">Other</option>
          </select>
          {/* ✅ NEW SUBCATEGORY INPUT */}
{productForm.subCategory === "Other" && (
  <input
    type="text"
    placeholder="New SubCategory"
    value={productForm.newSubCategory}
    onChange={(e) =>
      handleChange("newSubCategory", e.target.value)
    }
    className="p-3 rounded bg-black/30"
  />
)}

          <input
            type="text"
            placeholder="Color"
            value={productForm.color}
            onChange={(e) => handleChange("color", e.target.value)}
            className="p-3 rounded bg-black/30"
          />

          {/* IMAGE UPLOAD */}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            onChange={handleImageUpload}
          />

          <button
            type="button"
            onClick={openFilePicker}
            className="bg-white/10 p-3 rounded"
          >
            Upload Images
          </button>

          {uploadingImage && <p>Uploading...</p>}

          {/* PREVIEW */}
          <div className="grid grid-cols-3 gap-2">
            {mediaPreview.map((item, i) => (
              <img
                key={i}
                src={item.url}
                className="h-20 w-full object-cover rounded"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={addingProduct}
            className="bg-yellow-400 text-black p-3 rounded font-bold"
          >
            {addingProduct ? "Adding..." : "Add Product"}
          </button>
        </form>
      )}
    </main>
  );
}