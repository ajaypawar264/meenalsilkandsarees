"use client";
import { updateDoc, doc, addDoc } from "firebase/firestore";
import { setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
async function getNextProductNumber() {
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.size + 1;
}
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
   originalPrice: string; // 🔥 ADD
};

export default function AddProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  const [colorInputs, setColorInputs] = useState([
  { color: "", stock: 0, media: [] as UploadedMediaItem[] },
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
      originalPrice: "", // 🔥 ADD
    inStock: true,
  });

  const handleChange = (field: keyof ProductForm, value: any) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddColor = () => {
  setColorInputs((prev) => [
    ...prev,
    { color: "", stock: 0, media: [] }
  ]);
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

 

      // COLOR PRODUCTS
      const handleSubmit = async (e: React.FormEvent) => {
        
stock: colorInputs.reduce((sum, item) => sum + Number(item.stock || 0), 0),
  e.preventDefault();

  if (!productForm.name || !productForm.price) {
    alert("Name ani price required ahe");
    return;
  }

  try {
    setAddingProduct(true);

   let finalCategory = productForm.category;
let finalSubCategory = productForm.subCategory;

// ✅ NEW CATEGORY ADD
if (productForm.category === "Other" && productForm.newCategory) {
  finalCategory = productForm.newCategory;
const exists = categories.some(
  (cat) => cat.name === productForm.newCategory
);
if (exists) {
  alert("Category already exists");
  return;
}
  await addDoc(collection(db, "categories"), {
    name: productForm.newCategory,
    subCategories: productForm.newSubCategory
      ? [productForm.newSubCategory]
      : [],
    createdAt: serverTimestamp(),
  });
}

// ✅ NEW SUBCATEGORY ADD
else if (productForm.subCategory === "Other" && productForm.newSubCategory) {
  finalSubCategory = productForm.newSubCategory;

  const categoryRef = categories.find(
    (cat) => cat.name === productForm.category
  );

  if (categoryRef) {
    await updateDoc(doc(db, "categories", categoryRef.id), {
      subCategories: [
        ...new Set([
          ...(categoryRef.subCategories || []),
          productForm.newSubCategory,
        ]),
      ],
    });
  }
}
    // ... (category + subcategory logic same thev)

    // ✅ Build colors array
  const colorsData = colorInputs
  .filter((item) => item.color && item.media.length > 0)
  .map((item: any) => ({
    color: item.color,
    stock: Number(item.stock || 0), // ✅ USE COLOR STOCK
    imageUrl: item.media[0]?.url || "",
    mediaFiles: item.media,
  }));

    // 🔥 👉 HE ITHE TAK
    if (colorsData.length === 0) {
      alert("At least one color with image required");
      return;
    }

    // ✅ Save SINGLE product
   // 🔥 number generate kar
const productNumber = await getNextProductNumber();



// 👉 custom ID banav
const customId = `product-${productNumber}`;

// 👉 setDoc use kar
await setDoc(doc(db, "products", customId), {
 baseName: productForm.name,
  price: Number(productForm.price),
  originalPrice: Number(productForm.originalPrice || 0),
  category: finalCategory,
  subCategory: finalSubCategory,
  createdAt: serverTimestamp(),
    stock: colorInputs.reduce(
    (sum, item) => sum + Number(item.stock || 0),
    0
  ),

  colors: colorInputs.map((item) => ({
    color: item.color,
    stock: Number(item.stock || 0),
    imageUrl: item.media?.[0]?.url || "",
    mediaFiles: item.media,
  })),
});

    alert("Products added successfully ✅");
await refreshCategories();
      

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
          originalPrice: "", // 🔥 ADD
      });

      setColorInputs([{ color: "", stock: 0, media: [] }]);
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
  placeholder="Original Price (MRP)"
  value={productForm.originalPrice}
  onChange={(e) => handleChange("originalPrice", e.target.value)}
  className="p-3 rounded bg-black/30"
/>
          <input
            type="number"
            placeholder="Price"
            value={productForm.price}
            onChange={(e) => handleChange("price", e.target.value)}
            className="p-3 rounded bg-black/30"
          />
          {productForm.originalPrice && productForm.price && (
  <p className="text-green-400 font-semibold">
    Discount:{" "}
    {Math.round(
      ((Number(productForm.originalPrice) - Number(productForm.price)) /
        Number(productForm.originalPrice)) *
        100
    )}
    %
  </p>
)}

         

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
  type="number"
  placeholder="Color Stock"
  value={item.stock || 0}
  onChange={(e) => {
    const updated = [...colorInputs];
    (updated[index] as any).stock = Number(e.target.value);
    setColorInputs(updated);
  }}
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