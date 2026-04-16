import { createContext, useContext, useMemo } from "react";
import { STORAGE_KEYS } from "../config/constants";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { calculateCartTotal } from "../features/checkout/cartMath";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorageState(STORAGE_KEYS.cart, []);

  const addItem = (book) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.bookId === book.id);
      if (existing) {
        return prev.map((item) =>
          item.bookId === book.id
            ? { ...item, qty: item.qty + 1 }
            : item,
        );
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
  };

  const removeItem = (bookId) => {
    setItems((prev) => prev.filter((item) => item.bookId !== bookId));
  };

  const updateQuantity = (bookId, qty) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.bookId === bookId
            ? { ...item, qty: Math.max(1, Number(qty || 1)) }
            : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const clearCart = () => setItems([]);

  const total = useMemo(
    () => calculateCartTotal(items),
    [items],
  );

  const count = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [items],
  );

  const value = {
    items,
    count,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
