// lib/wishlist.ts

export const getWishlist = () => {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem("wishlist");
  return data ? JSON.parse(data) : [];
};

export const addToWishlist = (product: any) => {
  const wishlist = getWishlist();

  const exists = wishlist.find((item: any) => item.id === product.id);

  if (!exists) {
    wishlist.push(product);
    localStorage.setItem("wishlist", JSON.stringify(wishlist));

    window.dispatchEvent(new Event("wishlistUpdated"));
  }
};

export const removeFromWishlist = (id: string) => {
  let wishlist = getWishlist();

  wishlist = wishlist.filter((item: any) => item.id !== id);

  localStorage.setItem("wishlist", JSON.stringify(wishlist));

  window.dispatchEvent(new Event("wishlistUpdated"));
};
