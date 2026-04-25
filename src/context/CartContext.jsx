import { createContext, useContext, useEffect, useMemo, useCallback } from "react";
import { STORAGE_KEYS } from "../config/constants";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { calculateCartTotal } from "../features/checkout/cartMath";

const CartContext = createContext(null);

function sanitizeCartItems(items) {
  const list = Array.isArray(items) ? items : [];
  const seen = new Set();
  const normalized = [];
  let changed = false;

  for (const item of list) {
    if (!item?.bookId) {
      changed = true;
      continue;
    }

    if (seen.has(item.bookId)) {
      changed = true;
      continue;
    }

    seen.add(item.bookId);
    if (Number(item.qty || 0) !== 1) {
      changed = true;
    }

    normalized.push({
      ...item,
      qty: 1,
    });
  }

  return { normalized, changed };
}

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorageState(STORAGE_KEYS.cart, []);

  useEffect(() => {
    setItems((prev) => {
      const { normalized, changed } = sanitizeCartItems(prev);
      return changed ? normalized : prev;
    });
  }, [setItems]);

  const addItem = useCallback((book) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.bookId === book.id);
      if (existing) {
        return prev;
      }

      return [
        ...prev,
        {
          bookId: book.id,
          title: book.title,
          author: book.author,
          image: book.image,
          unitPrice: Number(book.price || 0),
          qty: 1,
          pages: book.pages,
          category: book.category,
        },
      ];
    });
  }, [setItems]);

  const removeItem = useCallback((bookId) => {
    setItems((prev) => prev.filter((item) => item.bookId !== bookId));
  }, [setItems]);

  const updateQuantity = useCallback((bookId, qty) => {
    if (Number(qty || 0) <= 0) {
      removeItem(bookId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.bookId === bookId
          ? { ...item, qty: 1 }
          : item,
      ),
    );
  }, [setItems, removeItem]);

  const clearCart = useCallback(() => setItems([]), [setItems]);

  const total = useMemo(
    () => calculateCartTotal(items),
    [items],
  );

  const count = useMemo(
    () => items.length,
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      count,
      total,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, count, total, addItem, removeItem, updateQuantity, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
