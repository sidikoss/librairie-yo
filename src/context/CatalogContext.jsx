import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CATEGORIES, STORAGE_KEYS } from "../config/constants";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import {
  createBook,
  deleteBook,
  fetchBookFile,
  fetchBooks,
  updateBook,
  uploadBookFile,
} from "../services/bookService";
import {
  buildSalesByBookMap,
  createOrder,
  createPromoCode,
  deletePromoCode,
  fetchOrders,
  fetchOrdersFresh,
  fetchPromoCodes,
  togglePromoCode,
  updateOrderStatus as apiUpdateOrderStatus,
} from "../services/orderService";
import {
  normalizeBook,
  serializeBookToFirebase,
} from "../features/catalog/bookModel";
import { normalizePhone } from "../utils/format";

const CatalogContext = createContext(null);

function loadCachedBooks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.booksCache);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCachedBooks(books) {
  try {
    localStorage.setItem(STORAGE_KEYS.booksCache, JSON.stringify(books));
  } catch {
    // Ignore cache write errors to keep UX resilient on low-memory phones.
  }
}

export function CatalogProvider({ children }) {
  const [books, setBooks] = useState(loadCachedBooks);
  const [orders, setOrders] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(() => loadCachedBooks().length === 0);
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [wishlistIds, setWishlistIds] = useLocalStorageState(
    STORAGE_KEYS.wishlist,
    [],
  );

  const refreshCatalog = useCallback(async (useFresh = false) => {
    setError("");
    setSyncing(true);

    try {
      const ordersFetcher = useFresh ? fetchOrdersFresh : fetchOrders;
      const [rawBooks, rawOrders, rawPromos] = await Promise.all([
        fetchBooks(),
        ordersFetcher(),
        fetchPromoCodes(),
      ]);

      const salesMap = buildSalesByBookMap(rawOrders);
      const normalizedBooks = rawBooks
        .filter((b) => b && (b.id || b.fbKey))
        .map((rawBook) =>
          normalizeBook(rawBook, salesMap[rawBook.fbKey || rawBook.id] || 0),
        );

      setBooks(normalizedBooks);
      setOrders(rawOrders);
      setPromoCodes(rawPromos);
      setLastSyncAt(Date.now());
      saveCachedBooks(normalizedBooks);
    } catch (refreshError) {
      setError(refreshError?.message || "Impossible de synchroniser le catalogue.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const favoriteBooks = useMemo(
    () => books.filter((book) => wishlistIds.includes(book.id)),
    [books, wishlistIds],
  );

  const totalSoldBooks = useMemo(
    () => books.reduce((sum, book) => sum + Number(book.salesCount || 0), 0),
    [books],
  );

  const popularBooks = useMemo(
    () =>
      [...books]
        .sort((a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0))
        .slice(0, 8),
    [books],
  );

  const newBooks = useMemo(
    () => books.filter((book) => book.isNew).slice(0, 8),
    [books],
  );

  const wishlistSet = useMemo(
    () => new Set(wishlistIds),
    [wishlistIds],
  );

  const toggleWishlist = useCallback((bookId) => {
    setWishlistIds((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId],
    );
  }, [setWishlistIds]);

  const isFavorite = useCallback(
    (bookId) => wishlistSet.has(bookId),
    [wishlistSet],
  );

  const getBookById = useCallback(
    (bookId) => books.find((book) => book.id === bookId),
    [books],
  );

  const upsertBook = async ({ draft, filePayload = null, bookId = null }) => {
    const currentBook = books.find((book) => book.id === bookId);
    const payload = serializeBookToFirebase(draft, currentBook);

    let resolvedBookId = bookId;
    if (bookId) {
      await updateBook(bookId, payload);
    } else {
      resolvedBookId = await createBook(payload);
    }

    if (resolvedBookId && filePayload?.fileData) {
      await uploadBookFile(resolvedBookId, filePayload);
    }

    await refreshCatalog();
    return resolvedBookId;
  };

  const removeBook = async (bookId) => {
    await deleteBook(bookId);
    await refreshCatalog();
  };

  const submitOrder = async (orderDraft) => {
    const payload = {
      ...orderDraft,
      phone: normalizePhone(orderDraft.phone),
      status: "pending",
      createdAt: Date.now(),
    };

    const response = await createOrder(payload);
    await refreshCatalog();
    return response?.name || null;
  };

  const findOrdersByPhoneAndPin = async (phone, pin) => {
    const normalized = normalizePhone(phone);
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized, pin })
      });
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
        return data.orders;
      }
      return [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const setOrderStatus = async (orderId, status) => {
    console.log('[Admin] Updating order:', orderId, 'to', status);
    
    // Try admin API first (server-side) - use same key as AdminPage.jsx
    const SESSION_KEY = STORAGE_KEYS.adminSession;
    
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const token = raw ? JSON.parse(raw)?.token : null;
      console.log('[Admin] Token exists:', !!token);
      
      if (token) {
        const res = await fetch('/api/admin?action=update-order', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ orderId, status })
        });
        console.log('[Admin] API response:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('[Admin] API success:', data);
          await refreshCatalog();
          return;
        } else {
          const data = await res.json();
          console.error('[Admin] API error:', data);
        }
      }
    } catch (e) {
      console.warn('[Admin] API update failed:', e.message);
    }
    
    // Fallback to Firebase API (client-side)
    console.log('[Admin] Trying client-side Firebase update...');
    await apiUpdateOrderStatus(orderId, status);
    await refreshCatalog();
  };

  const getBookFile = async (bookId) => {
    return fetchBookFile(bookId);
  };

  const addPromo = async (promo) => {
    await createPromoCode({
      code: promo.code.toUpperCase(),
      discount: Number(promo.discount || 0),
      type: promo.type || "percent",
      maxUses: Number(promo.maxUses || 100),
      uses: 0,
      active: true,
      createdAt: Date.now(),
    });
    await refreshCatalog();
  };

  const togglePromo = async (promo) => {
    await togglePromoCode(promo);
    await refreshCatalog();
  };

  const removePromo = async (promoId) => {
    await deletePromoCode(promoId);
    await refreshCatalog();
  };

  const value = useMemo(() => ({
    books,
    orders,
    promoCodes,
    loading,
    syncing,
    error,
    lastSyncAt,
    categories: CATEGORIES,
    wishlistIds,
    favoriteBooks,
    totalSoldBooks,
    popularBooks,
    newBooks,
    refreshCatalog,
    toggleWishlist,
    isFavorite,
    getBookById,
    upsertBook,
    removeBook,
    submitOrder,
    findOrdersByPhoneAndPin,
    setOrderStatus,
    getBookFile,
    addPromo,
    togglePromo,
    removePromo,
  }), [
    books, orders, promoCodes, loading, syncing, error, lastSyncAt,
    wishlistIds, favoriteBooks, totalSoldBooks, popularBooks, newBooks,
    refreshCatalog, toggleWishlist, isFavorite, getBookById,
    submitOrder, findOrdersByPhoneAndPin
  ]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return context;
}

