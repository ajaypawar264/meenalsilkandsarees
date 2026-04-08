"use client";
import { updateDoc, doc, addDoc } from "firebase/firestore";

import { useEffect, useState } from "react";
import {
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
  newSubCategory: string;
  newCategory: string;
  description: string;
  inStock: boolean;
};

export default function AddProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  const [colorInputs, setColorInputs] = useState([
    { color: "", media: [] as UploadedMediaItem[] },
  ]);

  const [categories, setCategories] = useState<any[]>([]);

  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    price: "",
    stock: "",
    category: "",
    description: "",
    subCategory: "",
    newSubCategory: "",
    newCategory: "",
    inStock: true,
  });

  const handleChange = (field: keyof ProductForm, value: any) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddColor = () => {
    setColorInputs((prev) => [...prev, { color: "", media: [] }]);
  };

  const handleColorChange = (index: number, value: string) => {
    const updated = [...colorInputs];
    updated[index].color = value;
    setColorInputs(updated);
  };

  const handleImageUploadForColor = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
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

      const updated = [...colorInputs];
      updated[index].media = [...updated[index].media, ...uploaded];

      setColorInputs(updated);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  // 🔥 refresh categories helper
  const refreshCategories = async () => {
    const snap = await getDocs(collection(db, "categories"));
    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setCategories(data);
  };

  useEffect(() => {
    refreshCategories();
  }, []);

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

      // CATEGORY
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

        await refreshCategories();
      }

      // SUBCATEGORY
      if (productForm.subCategory === "Other") {
        if (!productForm.newSubCategory) {
          alert("Enter new subcategory");
          return;
        }

        finalSubCategory = productForm.newSubCategory;

        const selectedCat = categories.find(
          (cat) => cat.name === finalCategory
        );

        if (selectedCat) {
          const categoryRef = doc(db, "categories", selectedCat.id);

          await updateDoc(categoryRef, {
            subCategories: [
              ...(selectedCat.subCategories || []),
              productForm.newSubCategory,
            ],
          });

          // 🔥 IMPORTANT: refresh after update
          await refreshCategories();
        }
      }

      // COLOR PRODUCTS
      for (const item of colorInputs) {
        if (!item.color) continue;

        await addDoc(collection(db, "products"), {
          name: productForm.name,
          category: finalCategory,
          subCategory: finalSubCategory,
          color: item.color,
          mediaFiles: item.media,
          price: Number(productForm.price),
          stock: Number(productForm.stock || 0),
          description:
            productForm.description ||
            "Premium quality product from our store",
          inStock: productForm.inStock,
          createdAt: serverTimestamp(),
        });
      }

      alert("Products added successfully ✅");

      setProductForm({
        name: "",
        price: "",
        stock: "",
        category: "",
        description: "",
        subCategory: "",
        newCategory: "",
        newSubCategory: "",
        inStock: true,
      });

      setColorInputs([{ color: "", media: [] }]);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert("Error adding product");
    } finally {
      setAddingProduct(false);
    }
  };

  const selectedCategory = categories.find(
    (cat) => cat.name === productForm.category
  );

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Add Products</h1>

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold"
      >
        {showForm ? "Close Form" : "Add Product"}
      </button>

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

          <textarea
            placeholder="Description"
            value={productForm.description}
            onChange={(e) => handleChange("description", e.target.value)}
            className="p-3 rounded bg-black/30"
          />

          {/* CATEGORY */}
          <select
            value={productForm.category}
            onChange={(e) => {
              handleChange("category", e.target.value);
              handleChange("subCategory", "");
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

          {productForm.category === "Other" && (
            <input
              type="text"
              placeholder="Enter New Category"
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

          {productForm.subCategory === "Other" && (
            <input
              type="text"
              placeholder="Enter New SubCategory"
              value={productForm.newSubCategory}
              onChange={(e) =>
                handleChange("newSubCategory", e.target.value)
              }
              className="p-3 rounded bg-black/30"
            />
          )}

          {/* COLOR VARIANTS */}
          {colorInputs.map((item, index) => (
            <div key={index} className="border p-3 rounded">
              <input
                type="text"
                placeholder="Enter Color"
                value={item.color}
                onChange={(e) =>
                  handleColorChange(index, e.target.value)
                }
                className="p-3 rounded bg-black/30 w-full mb-2"
              />

              <input
                type="file"
                multiple
                onChange={(e) =>
                  handleImageUploadForColor(e, index)
                }
              />

              <div className="grid grid-cols-3 gap-2 mt-2">
                {item.media.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    className="h-20 w-full object-cover"
                  />
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddColor}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            ➕ Add Another Color
          </button>

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