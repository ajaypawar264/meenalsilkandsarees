export type CartItem = {
  id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
  qty: number;
};

/**
 * Logged-in user च्या mobile number नुसार
 * वेगळा cart key तयार होईल.
 *
 * Example:
 * minal_cart_9876543210
 */
function getCartKey(): string | null {
  if (typeof window === "undefined") return null;

  const mobile = localStorage.getItem("user_mobile")?.trim();

  if (!mobile) return null;

  return `minal_cart_${mobile}`;
}

/**
 * Current logged-in user चा cart fetch करतो
 */
export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  const key = getCartKey();

  if (!key) return [];

  try {
    const raw = localStorage.getItem(key);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item) =>
        item &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.qty === "number"
    );
  } catch {
    return [];
  }
}

/**
 * Current logged-in user च्या cart मध्ये save करतो
 */
export function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;

  const key = getCartKey();

  if (!key) return;

  localStorage.setItem(key, JSON.stringify(cart));

  window.dispatchEvent(new Event("cart_updated"));
}

/**
 * Product cart मध्ये add करतो
 */
export function addToCart(item: Omit<CartItem, "qty">) {
  const cart = getCart();

  const cleanItem = {
    id: String(item.id || "").trim(),
    name: String(item.name || "").trim(),
    price: Number(item.price || 0),
    category: item.category || "",
    imageUrl: item.imageUrl || "",
  };

  if (!cleanItem.id || !cleanItem.name || cleanItem.price <= 0) {
    return;
  }

  const existing = cart.find((c) => c.id === cleanItem.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      ...cleanItem,
      qty: 1,
    });
  }

  saveCart(cart);
}

/**
 * Cart मधून product remove करतो
 */
export function removeFromCart(id: string) {
  const cart = getCart().filter((item) => item.id !== id);

  saveCart(cart);
}

/**
 * Product quantity update करतो
 */
export function updateQty(id: string, qty: number) {
  const safeQty = Number(qty);

  const cart = getCart().map((item) =>
    item.id === id
      ? {
          ...item,
          qty: safeQty,
        }
      : item
  );

  saveCart(cart.filter((item) => item.qty > 0));
}

/**
 * Current logged-in user चा पूर्ण cart clear करतो
 */
export function clearCart() {
  saveCart([]);
}

/**
 * Cart मधील total quantity
 */
export function cartCount(): number {
  return getCart().reduce(
    (sum, item) => sum + item.qty,
    0
  );
}

/**
 * Cart ची total price
 */
export function cartTotal(): number {
  return getCart().reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
}