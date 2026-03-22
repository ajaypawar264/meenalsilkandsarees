export type CartItem = {
  id: string;
  name: string;
  price: number;
  category?: string;
  imageUrl?: string;
  qty: number;
};

const KEY = "minal_cart_v1";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(KEY);
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

export function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart_updated"));
}

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
    cart.push({ ...cleanItem, qty: 1 });
  }

  saveCart(cart);
}

export function removeFromCart(id: string) {
  const cart = getCart().filter((c) => c.id !== id);
  saveCart(cart);
}

export function updateQty(id: string, qty: number) {
  const safeQty = Number(qty);

  const cart = getCart().map((c) =>
    c.id === id ? { ...c, qty: safeQty } : c
  );

  saveCart(cart.filter((c) => c.qty > 0));
}

export function clearCart() {
  saveCart([]);
}

export function cartCount(): number {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

export function cartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.price * item.qty, 0);
}