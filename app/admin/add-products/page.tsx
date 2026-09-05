"use client";

import {
  updateDoc,
  doc,
  addDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

async function getNextProductNumber() {
  const snapshot = await getDocs(collection(db, "products"));
  return snapshot.size + 1;
}

type UploadedMediaItem = {
  url: string;
};

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
  originalPrice: string;
};

export default function AddProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);

  const [colorInputs, setColorInputs] = useState([
    {
      color: "",
      stock: 0,
      media: [] as UploadedMediaItem[],
    },
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
    originalPrice: "",
    inStock: true,
  });

  const handleChange = (
    field: keyof ProductForm,
    value: any
  ) => {
    setProductForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddColor = () => {
    setColorInputs((prev) => [
      ...prev,
      {
        color: "",
        stock: 0,
        media: [],
      },
    ]);
  };

  const handleColorChange = (
    index: number,
    value: string
  ) => {
    setColorInputs((prev) => {
      const updated = [...prev];

      updated[index] = {
        ...updated[index],
        color: value,
      };

      return updated;
    });
  };

  // =====================================================
  // IMAGEKIT IMAGE UPLOAD
  // =====================================================
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
        const formData = new FormData();

        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        // IMPORTANT:
        // Response body ekdach read karto.
        // response.json() + response.text() donhi use nahi karayche.
        const responseText = await response.text();

        let data: any = null;

        try {
          data = JSON.parse(responseText);
        } catch {
          console.error(
            "SERVER RETURNED NON JSON:",
            responseText
          );

          throw new Error(
            `Server returned invalid response (${response.status})`
          );
        }

        if (!response.ok) {
          console.error(
            "UPLOAD STATUS:",
            response.status
          );

          console.error(
            "UPLOAD RESPONSE:",
            data
          );

          throw new Error(
            data?.message ||
              "Image upload failed"
          );
        }

        if (!data?.url) {
          console.error(
            "IMAGEKIT RESPONSE:",
            data
          );

          throw new Error(
            "ImageKit URL not received"
          );
        }

        uploaded.push({
          url: data.url,
        });
      }

      // Add uploaded images to selected color
      setColorInputs((prev) => {
        const updated = [...prev];

        updated[index] = {
          ...updated[index],
          media: [
            ...updated[index].media,
            ...uploaded,
          ],
        };

        return updated;
      });

    } catch (error) {
      console.error(
        "IMAGE UPLOAD ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Image upload failed"
      );
    } finally {
      setUploadingImage(false);

      // Same image/file पुन्हा select karta yava
      e.target.value = "";
    }
  };

  // =====================================================
  // REFRESH CATEGORIES
  // =====================================================
  const refreshCategories = async () => {
    try {
      const snap = await getDocs(
        collection(db, "categories")
      );

      const data = snap.docs.map((categoryDoc) => ({
        id: categoryDoc.id,
        ...categoryDoc.data(),
      }));

      setCategories(data);
    } catch (error) {
      console.error(
        "CATEGORY LOAD ERROR:",
        error
      );
    }
  };

  useEffect(() => {
    refreshCategories();
  }, []);

  // =====================================================
  // SUBMIT PRODUCT
  // =====================================================
  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !productForm.name.trim() ||
      !productForm.price
    ) {
      alert("Name ani price required ahe");
      return;
    }

    if (uploadingImage) {
      alert(
        "Please wait image upload complete honyaparyant."
      );
      return;
    }

    try {
      setAddingProduct(true);

      let finalCategory =
        productForm.category;

      let finalSubCategory =
        productForm.subCategory;

      // =================================================
      // NEW CATEGORY
      // =================================================
      if (
        productForm.category === "Other" &&
        productForm.newCategory.trim()
      ) {
        finalCategory =
          productForm.newCategory.trim();

        const exists = categories.some(
          (cat) =>
            cat.name?.toLowerCase() ===
            finalCategory.toLowerCase()
        );

        if (exists) {
          alert("Category already exists");
          return;
        }

        await addDoc(
          collection(db, "categories"),
          {
            name: finalCategory,

            subCategories:
              productForm.newSubCategory.trim()
                ? [
                    productForm.newSubCategory.trim(),
                  ]
                : [],

            createdAt:
              serverTimestamp(),
          }
        );
      }

      // =================================================
      // NEW SUBCATEGORY
      // =================================================
      else if (
        productForm.subCategory ===
          "Other" &&
        productForm.newSubCategory.trim()
      ) {
        finalSubCategory =
          productForm.newSubCategory.trim();

        const categoryRef =
          categories.find(
            (cat) =>
              cat.name ===
              productForm.category
          );

        if (categoryRef) {
          await updateDoc(
            doc(
              db,
              "categories",
              categoryRef.id
            ),
            {
              subCategories: [
                ...new Set([
                  ...(categoryRef.subCategories ||
                    []),

                  finalSubCategory,
                ]),
              ],
            }
          );
        }
      }

      // =================================================
      // COLORS
      // =================================================
      const colorsData = colorInputs
        .filter(
          (item) =>
            item.color.trim() &&
            item.media.length > 0
        )
        .map((item) => ({
          color: item.color.trim(),

          stock: Number(
            item.stock || 0
          ),

          imageUrl:
            item.media[0]?.url || "",

          mediaFiles: item.media,
        }));

      if (colorsData.length === 0) {
        alert(
          "At least one color with image required"
        );

        return;
      }

      // =================================================
      // PRODUCT NUMBER
      // =================================================
      const productNumber =
        await getNextProductNumber();

      // =================================================
      // CUSTOM ID
      // =================================================
      const customId =
        `product-${productNumber}`;

      // =================================================
      // TOTAL STOCK
      // =================================================
      const totalStock =
        colorInputs.reduce(
          (sum, item) =>
            sum +
            Number(
              item.stock || 0
            ),
          0
        );

      // =================================================
      // SAVE PRODUCT
      // =================================================
      await setDoc(
        doc(
          db,
          "products",
          customId
        ),
        {
          baseName:
            productForm.name.trim(),

          name:
            productForm.name.trim(),

          description:
            productForm.description,

          price:
            Number(productForm.price),

          originalPrice:
            Number(
              productForm.originalPrice || 0
            ),

          category:
            finalCategory,

          subCategory:
            finalSubCategory,

          createdAt:
            serverTimestamp(),

          stock:
            totalStock,

          colors:
            colorsData,
        }
      );

      alert(
        "Products added successfully ✅"
      );

      await refreshCategories();

      // =================================================
      // RESET FORM
      // =================================================
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
        originalPrice: "",
      });

      setColorInputs([
        {
          color: "",
          stock: 0,
          media: [],
        },
      ]);

      setShowForm(false);

    } catch (error) {
      console.error(
        "ADD PRODUCT ERROR:",
        error
      );

      alert(
        "Error adding product"
      );
    } finally {
      setAddingProduct(false);
    }
  };

  // =====================================================
  // SELECTED CATEGORY
  // =====================================================
  const selectedCategory =
    categories.find(
      (cat) =>
        cat.name ===
        productForm.category
    );

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <h1 className="text-3xl font-bold mb-6">
        Add Products
      </h1>

      <button
        type="button"
        onClick={() =>
          setShowForm(!showForm)
        }
        className="mb-6 bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold"
      >
        {showForm
          ? "Close Form"
          : "Add Product"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 max-w-xl bg-white/5 p-6 rounded-2xl"
        >

          {/* PRODUCT NAME */}
          <input
            type="text"
            placeholder="Product Name"
            value={productForm.name}
            onChange={(e) =>
              handleChange(
                "name",
                e.target.value
              )
            }
            className="p-3 rounded bg-black/30"
          />

          {/* ORIGINAL PRICE */}
          <input
            type="number"
            placeholder="Original Price (MRP)"
            value={
              productForm.originalPrice
            }
            onChange={(e) =>
              handleChange(
                "originalPrice",
                e.target.value
              )
            }
            className="p-3 rounded bg-black/30"
          />

          {/* PRICE */}
          <input
            type="number"
            placeholder="Price"
            value={productForm.price}
            onChange={(e) =>
              handleChange(
                "price",
                e.target.value
              )
            }
            className="p-3 rounded bg-black/30"
          />

          {/* DISCOUNT */}
          {productForm.originalPrice &&
            productForm.price && (
              <p className="text-green-400 font-semibold">
                Discount:{" "}
                {Math.round(
                  (
                    (
                      Number(
                        productForm.originalPrice
                      ) -
                      Number(
                        productForm.price
                      )
                    ) /
                    Number(
                      productForm.originalPrice
                    )
                  ) *
                  100
                )}
                %
              </p>
            )}

          {/* DESCRIPTION */}
          <textarea
            placeholder="Description"
            value={
              productForm.description
            }
            onChange={(e) =>
              handleChange(
                "description",
                e.target.value
              )
            }
            className="p-3 rounded bg-black/30 min-h-[120px]"
          />

          {/* CATEGORY */}
          <select
            value={
              productForm.category
            }
            onChange={(e) => {
              handleChange(
                "category",
                e.target.value
              );

              handleChange(
                "subCategory",
                ""
              );
            }}
            className="p-3 rounded bg-black/30"
          >
            <option value="">
              Select Category
            </option>

            {categories.map((cat) => (
              <option
                key={cat.id}
                value={cat.name}
              >
                {cat.name}
              </option>
            ))}

            <option value="Other">
              Other
            </option>
          </select>

          {/* NEW CATEGORY */}
          {productForm.category ===
            "Other" && (
            <input
              type="text"
              placeholder="Enter New Category"
              value={
                productForm.newCategory
              }
              onChange={(e) =>
                handleChange(
                  "newCategory",
                  e.target.value
                )
              }
              className="p-3 rounded bg-black/30"
            />
          )}

          {/* SUBCATEGORY */}
          <select
            value={
              productForm.subCategory
            }
            onChange={(e) =>
              handleChange(
                "subCategory",
                e.target.value
              )
            }
            className="p-3 rounded bg-black/30"
          >
            <option value="">
              Select SubCategory
            </option>

            {selectedCategory?.subCategories?.map(
              (sub: string) => (
                <option
                  key={sub}
                  value={sub}
                >
                  {sub}
                </option>
              )
            )}

            <option value="Other">
              Other
            </option>
          </select>

          {/* NEW SUBCATEGORY */}
          {productForm.subCategory ===
            "Other" && (
            <input
              type="text"
              placeholder="Enter New SubCategory"
              value={
                productForm.newSubCategory
              }
              onChange={(e) =>
                handleChange(
                  "newSubCategory",
                  e.target.value
                )
              }
              className="p-3 rounded bg-black/30"
            />
          )}

          {/* =================================================
              COLOR VARIANTS
          ================================================= */}
          {colorInputs.map(
            (item, index) => (
              <div
                key={index}
                className="border border-white/20 p-3 rounded"
              >

                {/* COLOR */}
                <input
                  type="text"
                  placeholder="Enter Color"
                  value={item.color}
                  onChange={(e) =>
                    handleColorChange(
                      index,
                      e.target.value
                    )
                  }
                  className="p-3 rounded bg-black/30 w-full mb-2"
                />

                {/* STOCK */}
                <input
                  type="number"
                  placeholder="Color Stock"
                  value={
                    item.stock || 0
                  }
                  onChange={(e) => {
                    const value =
                      Number(
                        e.target.value
                      );

                    setColorInputs(
                      (prev) => {
                        const updated = [
                          ...prev,
                        ];

                        updated[index] = {
                          ...updated[index],
                          stock: value,
                        };

                        return updated;
                      }
                    );
                  }}
                  className="p-3 rounded bg-black/30 w-full mb-2"
                />

                {/* IMAGE */}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={
                    uploadingImage
                  }
                  onChange={(e) =>
                    handleImageUploadForColor(
                      e,
                      index
                    )
                  }
                  className="block w-full text-sm"
                />

                {/* UPLOAD STATUS */}
                {uploadingImage && (
                  <p className="text-yellow-400 text-sm mt-2">
                    Uploading image to ImageKit...
                  </p>
                )}

                {/* PREVIEW */}
                {item.media.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {item.media.map(
                      (img, i) => (
                        <div
                          key={i}
                          className="relative"
                        >
                          <img
                            src={img.url}
                            className="h-20 w-full object-cover rounded"
                            alt={`Product ${i + 1}`}
                          />
                        </div>
                      )
                    )}
                  </div>
                )}

              </div>
            )
          )}

          {/* ADD COLOR */}
          <button
            type="button"
            onClick={
              handleAddColor
            }
            disabled={
              uploadingImage
            }
            className="bg-blue-500 px-4 py-2 rounded font-semibold disabled:opacity-50"
          >
            ➕ Add Another Color
          </button>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={
              addingProduct ||
              uploadingImage
            }
            className="bg-yellow-400 text-black p-3 rounded font-bold disabled:opacity-50"
          >
            {addingProduct
              ? "Adding..."
              : uploadingImage
              ? "Uploading..."
              : "Add Product"}
          </button>

        </form>
      )}
    </main>
  );
}