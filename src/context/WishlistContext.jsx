import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "../config/constants";

const WishlistContext = createContext(null);

function getStoredWishlist() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.wishlist);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWishlist(items) {
  try {
    localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(items));
  } catch (error) {
    console.warn("[Wishlist] Failed to save:", error);
  }
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems(getStoredWishlist());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveWishlist(items);
    }
  }, [items, loading]);

  const addItem = useCallback((bookId, bookData = null) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === bookId)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: bookId,
          addedAt: Date.now(),
          data: bookData,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((bookId) => {
    setItems((prev) => prev.filter((item) => item.id !== bookId));
  }, []);

  const toggleItem = useCallback((bookId, bookData = null) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === bookId);
      if (exists) {
        return prev.filter((item) => item.id !== bookId);
      }
      return [
        ...prev,
        {
          id: bookId,
          addedAt: Date.now(),
          data: bookData,
        },
      ];
    });
  }, []);

  const isInWishlist = useCallback(
    (bookId) => items.some((item) => item.id === bookId),
    [items]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const getWishlistCount = useMemo(() => items.length, [items]);

  const getRecentItems = useCallback((limit = 5) => {
    return [...items]
      .sort((a, b) => b.addedAt - a.addedAt)
      .slice(0, limit);
  }, [items]);

  const value = {
    items,
    loading,
    addItem,
    removeItem,
    toggleItem,
    isInWishlist,
    clearWishlist,
    count: getWishlistCount,
    recentItems: getRecentItems(),
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}