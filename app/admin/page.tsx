"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogout } from "@/lib/adminAuth";
import {
  uploadFileToImageKit,
  type UploadedMediaItem,
} from "@/lib/imagekitUpload";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type OrderStatus = "Pending" | "Processing" | "Delivered" | "Cancelled";

type Order = {
  id: string;
  status?: OrderStatus;
  createdAt?: any;
};

type ProductForm = {
  name: string;
  price: string;
  stock: string;
  category: string;
  subCategory: string;
  newCategory: string;
  newSubCategory: string;
  color: string;
  imageUrl: string;
  inStock: boolean;
};

type PieSlice = {
  label: string;
  value: number;
  color: string;
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: "#f59e0b",
  Processing: "#06b6d4",
  Delivered: "#22c55e",
  Cancelled: "#ef4444",
};

const DEFAULT_CATEGORIES = [
  "Saree",
  "Silk Saree",
  "Cotton Saree",
  "Paithani",
  "Maheshwari",
  "Other",
];

const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
  Saree: ["Wedding Saree", "Party Wear Saree", "Casual Saree", "Festival Saree", "Other"],
  "Silk Saree": ["Banarasi", "Kanjivaram", "Soft Silk", "Pure Silk", "Other"],
  "Cotton Saree": ["Daily Wear", "Printed Cotton", "Handloom Cotton", "Office Wear", "Other"],
  Paithani: ["Traditional Paithani", "Semi Paithani", "Bridal Paithani", "Other"],
  "Dress Material": ["Unstitched", "Printed", "Designer", "Party Wear", "Other"],
  Kurti: ["Casual Kurti", "Festive Kurti", "Designer Kurti", "Other"],
  "Blouse Piece": ["Silk Blouse", "Cotton Blouse", "Designer Blouse", "Other"],
  Accessories: ["Fall Pico", "Matching Item", "Jewellery", "Other"],
  Other: ["Other"],
};

function formatMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    cx,
    cy,
    "L",
    start.x,
    start.y,
    "A",
    r,
    r,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    "Z",
  ].join(" ");
}

function PieChartCard({
  title,
  slices,
}: {
  title: string;
  slices: PieSlice[];
}) {
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <p className="mt-1 text-sm text-white/60">
            Total Orders: <span className="font-semibold text-white">{total}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        <div className="relative flex items-center justify-center">
          <svg width="240" height="240" viewBox="0 0 240 240">
            {total === 0 ? (
              <circle cx="120" cy="120" r="90" fill="#1f2937" />
            ) : (
              slices.map((slice, idx) => {
                const angle = (slice.value / total) * 360;
                const path = describeArc(
                  120,
                  120,
                  90,
                  currentAngle,
                  currentAngle + angle
                );
                currentAngle += angle;

                return (
                  <path
                    key={`${slice.label}-${idx}`}
                    d={path}
                    fill={slice.color}
                    stroke="#0b0b0b"
                    strokeWidth="2"
                  />
                );
              })
            )}
            <circle cx="120" cy="120" r="45" fill="#0f0f10" />
            <text
              x="120"
              y="114"
              textAnchor="middle"
              className="fill-white text-[14px] font-bold"
            >
              Orders
            </text>
            <text
              x="120"
              y="132"
              textAnchor="middle"
              className="fill-white/70 text-[12px]"
            >
              {total}
            </text>
          </svg>
        </div>

        <div className="w-full space-y-3">
          {slices.map((slice) => {
            const percent = total ? ((slice.value / total) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={slice.label}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-sm font-medium text-white">{slice.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{slice.value}</p>
                  <p className="text-xs text-white/60">{percent}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);

  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    price: "",
    stock: "",
    category: "",
    subCategory: "",
    newCategory: "",
    newSubCategory: "",
    color: "",
    imageUrl: "",
    inStock: true,
  });

  const [addingProduct, setAddingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMediaItem[]>([]);
  const [mediaPreview, setMediaPreview] = useState<UploadedMediaItem[]>([]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  const currentDate = new Date();
  const [chartView, setChartView] = useState<"month" | "year">("month");
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

  useEffect(() => {
    try {
      const adminLoggedIn =
        localStorage.getItem("admin_logged_in") ||
        localStorage.getItem("admin_session") ||
        localStorage.getItem("admin_email") ||
        localStorage.getItem("admin_user");

      if (!adminLoggedIn) {
        router.push("/admin-login");
        return;
      }

      setCheckingAuth(false);
    } catch (error) {
      console.error("Admin auth check error:", error);
      router.push("/admin-login");
    }
  }, [router]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoadingAnalytics(true);
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const list: Order[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Order, "id">),
        }));

        setOrders(list);
      } catch (error) {
        console.error("Orders fetch error:", error);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadOrders();
  }, []);

  const handleLogout = async () => {
    try {
      await adminLogout();
      localStorage.removeItem("admin_logged_in");
      localStorage.removeItem("admin_session");
      localStorage.removeItem("admin_email");
      localStorage.removeItem("admin_user");
      router.push("/admin-login");
    } catch (error) {
      console.error(error);
      alert("Logout failed");
    }
  };

  const handleProductChange = (
    field: keyof ProductForm,
    value: string | boolean
  ) => {
    setProductForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelection = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    try {
      setUploadingImage(true);

      const newlyUploadedItems: UploadedMediaItem[] = [];

      for (const file of files) {
        const uploaded = await uploadFileToImageKit(file);
        newlyUploadedItems.push(uploaded);
      }

      setUploadedMedia((prev) => {
        const updated = [...prev, ...newlyUploadedItems];

        const firstImage = updated.find((item) => item.type === "image");

        setProductForm((current) => ({
          ...current,
          imageUrl: firstImage?.url || updated[0]?.url || "",
        }));

        return updated;
      });

      setMediaPreview((prev) => [...prev, ...newlyUploadedItems]);
    } catch (error) {
      console.error("ImageKit upload error:", error);
      alert("Photo/video upload zala nahi.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeMediaItem = (indexToRemove: number) => {
    setUploadedMedia((prev) => {
      const updated = prev.filter((_, index) => index !== indexToRemove);
      const firstImage = updated.find((item) => item.type === "image");

      setProductForm((current) => ({
        ...current,
        imageUrl: firstImage?.url || updated[0]?.url || "",
      }));

      return updated;
    });

    setMediaPreview((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearAllMedia = () => {
    setUploadedMedia([]);
    setMediaPreview([]);
    setProductForm((prev) => ({
      ...prev,
      imageUrl: "",
    }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const subCategoryOptions = useMemo(() => {
    if (!productForm.category) return ["Other"];
    return DEFAULT_SUBCATEGORIES[productForm.category] || ["Other"];
  }, [productForm.category]);

  const buildSlices = (filteredOrders: Order[]): PieSlice[] => {
    const statusCounts: Record<OrderStatus, number> = {
      Pending: 0,
      Processing: 0,
      Delivered: 0,
      Cancelled: 0,
    };

    filteredOrders.forEach((order) => {
      const status = order.status || "Pending";
      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      }
    });

    return (Object.keys(statusCounts) as OrderStatus[]).map((status) => ({
      label: status,
      value: statusCounts[status],
      color: STATUS_COLORS[status],
    }));
  };

  const currentPeriodOrders = useMemo(() => {
    return orders.filter((order) => {
      const date = order?.createdAt?.toDate?.() || null;
      if (!(date instanceof Date) || isNaN(date.getTime())) return false;

      if (chartView === "month") {
        return (
          date.getFullYear() === selectedYear && date.getMonth() === selectedMonth
        );
      }

      return date.getFullYear() === selectedYear;
    });
  }, [orders, chartView, selectedYear, selectedMonth]);

  const previousPeriodOrders = useMemo(() => {
    return orders.filter((order) => {
      const date = order?.createdAt?.toDate?.() || null;
      if (!(date instanceof Date) || isNaN(date.getTime())) return false;

      if (chartView === "month") {
        let prevMonth = selectedMonth - 1;
        let prevYear = selectedYear;

        if (prevMonth < 0) {
          prevMonth = 11;
          prevYear -= 1;
        }

        return date.getFullYear() === prevYear && date.getMonth() === prevMonth;
      }

      return date.getFullYear() === selectedYear - 1;
    });
  }, [orders, chartView, selectedYear, selectedMonth]);

  const currentSlices = useMemo(
    () => buildSlices(currentPeriodOrders),
    [currentPeriodOrders]
  );

  const previousSlices = useMemo(
    () => buildSlices(previousPeriodOrders),
    [previousPeriodOrders]
  );

  const currentTitle =
    chartView === "month"
      ? formatMonthLabel(selectedYear, selectedMonth)
      : `${selectedYear}`;

  const previousTitle =
    chartView === "month"
      ? selectedMonth === 0
        ? formatMonthLabel(selectedYear - 1, 11)
        : formatMonthLabel(selectedYear, selectedMonth - 1)
      : `${selectedYear - 1}`;

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory =
      productForm.category === "Other"
        ? productForm.newCategory.trim()
        : productForm.category.trim();

    const finalSubCategory =
      productForm.subCategory === "Other"
        ? productForm.newSubCategory.trim()
        : productForm.subCategory.trim();

    if (!productForm.name.trim()) {
      alert("Product name required ahe.");
      return;
    }

    if (!productForm.price) {
      alert("Price required ahe.");
      return;
    }

    if (!finalCategory) {
      alert("Category select kiwa new category enter kara.");
      return;
    }

    if (!finalSubCategory) {
      alert("Sub category select kiwa new sub category enter kara.");
      return;
    }

    if (!productForm.color.trim()) {
      alert("Color enter kara.");
      return;
    }

    if (!productForm.imageUrl || uploadedMedia.length === 0) {
      alert("Photo kiwa video upload kara.");
      return;
    }

    try {
      setAddingProduct(true);

      await addDoc(collection(db, "products"), {
        name: productForm.name.trim(),
        price: Number(productForm.price),
        stock: Number(productForm.stock || 0),
        category: finalCategory,
        subCategory: finalSubCategory,
        color: productForm.color.trim(),
        imageUrl: productForm.imageUrl,
        mediaFiles: uploadedMedia,
        imageUrls: uploadedMedia
          .filter((item) => item.type === "image")
          .map((item) => item.url),
        videoUrls: uploadedMedia
          .filter((item) => item.type === "video")
          .map((item) => item.url),
        inStock: productForm.inStock,
        createdAt: serverTimestamp(),
      });

      alert("Product successfully add jhala.");

      setProductForm({
        name: "",
        price: "",
        stock: "",
        category: "",
        subCategory: "",
        newCategory: "",
        newSubCategory: "",
        color: "",
        imageUrl: "",
        inStock: true,
      });
      setUploadedMedia([]);
      setMediaPreview([]);
    } catch (error) {
      console.error("Add product error:", error);
      alert("Product add karta ala nahi.");
    } finally {
      setAddingProduct(false);
    }
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-black via-[#12090f] to-black text-white">
        Checking admin access...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-[#12090f] to-[#1a0d10] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-yellow-400">
                MINAL SILK ADMIN
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-white/60">
                Orders, products, gallery ani reviews alag pages madhun manage kara.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/daily-offer"
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white hover:bg-white/15"
              >
                Daily Offer Video
              </Link>

              <Link
                href="/"
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 transition hover:bg-white/20"
              >
                Shop
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-xl bg-red-500 px-4 py-2 transition hover:bg-red-400"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/admin/orders"
            className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-cyan-500/20"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Orders
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Order Management
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Pending, processing, delivered, return, exchange sagla manage kara.
            </p>
          </Link>

          <Link
            href="/admin/products"
            className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-yellow-500/20"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-yellow-300">
              Products
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Add Product / Stock
            </h2>
            <p className="mt-2 text-sm text-white/60">
              New product add kara, stock edit kara, categories manage kara.
            </p>
          </Link>

          <Link
            href="/admin/gallery"
            className="rounded-3xl border border-purple-500/20 bg-purple-500/10 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-purple-500/20"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-purple-300">
              Gallery
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Gallery Management
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Images ani videos add/edit kara.
            </p>
          </Link>

          <Link
            href="/admin/reviews"
            className="rounded-3xl border border-pink-500/20 bg-pink-500/10 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-pink-500/20"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-pink-300">
              Reviews
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Review Management
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Customer reviews approve, reject kiwa delete kara.
            </p>
          </Link>

          <Link
            href="/admin/customers"
            className="rounded-3xl border border-green-500/20 bg-green-500/10 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-green-500/20"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-green-300">
              Customers
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Customer Data
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Customer info ani order history bagha.
            </p>
          </Link>

          <Link
            href="/"
            className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-white/15"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">
              Live Site
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Visit Shop
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Customer side website open kara.
            </p>
          </Link>
        </div>

        <section className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[1.05fr_1.4fr]">
          <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-6 shadow-2xl">
            <div className="mb-5">
              <p className="text-sm uppercase tracking-[0.2em] text-yellow-300">
                Quick Add
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Product Add Form
              </h2>
              <p className="mt-2 text-sm text-white/60">
                Hya page वरून direct product add kara.
              </p>
            </div>

            <form onSubmit={handleAddProduct} className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Product Name
                </label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => handleProductChange("name", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-yellow-400"
                  placeholder="Enter product name"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-white/80">Price</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => handleProductChange("price", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-yellow-400"
                    placeholder="Enter price"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/80">Stock</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => handleProductChange("stock", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-yellow-400"
                    placeholder="Enter stock"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">Color</label>
                <input
                  type="text"
                  value={productForm.color}
                  onChange={(e) => handleProductChange("color", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-yellow-400"
                  placeholder="Ex. Red, Pink, Blue"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">Category</label>
                <select
                  value={productForm.category}
                  onChange={(e) => {
                    handleProductChange("category", e.target.value);
                    handleProductChange("subCategory", "");
                    handleProductChange("newCategory", "");
                    handleProductChange("newSubCategory", "");
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-yellow-400"
                >
                  <option value="">Select Category</option>
                  {DEFAULT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {productForm.category === "Other" && (
                <div>
                  <label className="mb-2 block text-sm text-white/80">
                    New Category
                  </label>
                  <input
                    type="text"
                    value={productForm.newCategory}
                    onChange={(e) => handleProductChange("newCategory", e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-yellow-400"
                    placeholder="Enter new category"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Sub Category
                </label>
                <select
                  value={productForm.subCategory}
                  onChange={(e) => {
                    handleProductChange("subCategory", e.target.value);
                    handleProductChange("newSubCategory", "");
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-yellow-400"
                >
                  <option value="">Select Sub Category</option>
                  {subCategoryOptions.map((subCategory) => (
                    <option key={subCategory} value={subCategory}>
                      {subCategory}
                    </option>
                  ))}
                </select>
              </div>

              {productForm.subCategory === "Other" && (
                <div>
                  <label className="mb-2 block text-sm text-white/80">
                    New Sub Category
                  </label>
                  <input
                    type="text"
                    value={productForm.newSubCategory}
                    onChange={(e) =>
                      handleProductChange("newSubCategory", e.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-yellow-400"
                    placeholder="Enter new sub category"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-white/80">
                  Upload Photos / Videos
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleImageSelection}
                  className="hidden"
                />

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={openImagePicker}
                    className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white transition hover:border-yellow-400"
                  >
                    {mediaPreview.length > 0
                      ? "Upload More Photos / Videos"
                      : "Choose Photos / Videos"}
                  </button>

                  {mediaPreview.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearAllMedia}
                      className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 transition hover:bg-red-500/20"
                    >
                      Clear All
                    </button>
                  ) : null}
                </div>

                {uploadingImage ? (
                  <p className="mt-3 text-sm text-yellow-300">
                    Photo/video uploading...
                  </p>
                ) : null}

                {mediaPreview.length > 0 ? (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-white/60">
                        Preview ({mediaPreview.length})
                      </p>
                      <p className="text-xs text-white/40">
                        First image website cover mhanun save hoil
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {mediaPreview.map((item, index) => (
                        <div
                          key={`${item.url}-${index}`}
                          className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                        >
                          {item.type === "video" ? (
                            <video
                              src={item.url}
                              controls
                              className="h-28 w-full object-cover"
                            />
                          ) : (
                            <img
                              src={item.url}
                              alt={`Preview ${index + 1}`}
                              className="h-28 w-full object-cover"
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => removeMediaItem(index)}
                            className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs text-white"
                          >
                            ✕
                          </button>

                          <div className="px-2 py-2 text-[11px] text-white/70">
                            {item.type === "video"
                              ? `Video ${index + 1}`
                              : `Photo ${index + 1}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="font-medium text-white">In Stock</p>
                  <p className="text-xs text-white/50">
                    Product available ahe ka nahi
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleProductChange("inStock", !productForm.inStock)
                  }
                  className={`relative h-8 w-16 rounded-full transition ${
                    productForm.inStock ? "bg-green-500" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
                      productForm.inStock ? "left-9" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <button
                type="submit"
                disabled={addingProduct || uploadingImage}
                className="mt-2 rounded-2xl bg-yellow-400 px-4 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {addingProduct ? "Adding Product..." : "Add Product"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6 shadow-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">
                  Analytics
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Orders Pie Chart
                </h2>
                <p className="mt-2 text-sm text-white/60">
                  Month wise kiwa year wise compare kara.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select
                  value={chartView}
                  onChange={(e) =>
                    setChartView(e.target.value as "month" | "year")
                  }
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                >
                  <option value="month">Month Wise</option>
                  <option value="year">Year Wise</option>
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                >
                  {Array.from(
                    new Set([
                      currentDate.getFullYear(),
                      ...orders
                        .map((order) => order?.createdAt?.toDate?.()?.getFullYear?.())
                        .filter(Boolean),
                    ])
                  )
                    .sort((a: any, b: any) => b - a)
                    .map((year: any) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                </select>

                {chartView === "month" ? (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none"
                  >
                    {Array.from({ length: 12 }).map((_, index) => (
                      <option key={index} value={index}>
                        {new Date(2026, index, 1).toLocaleString("en-IN", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                    Previous year auto compare
                  </div>
                )}
              </div>
            </div>

            {loadingAnalytics ? (
              <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6 text-white/70">
                Analytics loading...
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 gap-6 2xl:grid-cols-2">
                <PieChartCard title={currentTitle} slices={currentSlices} />
                <PieChartCard title={previousTitle} slices={previousSlices} />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}