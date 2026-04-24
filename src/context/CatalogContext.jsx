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
  fetchPromoCodes,
  togglePromoCode,
  updateOrderStatus as apiUpdateOrderStatus,
} from "../services/orderService";
import {
  normalizeBook,
  serializeBookToFirebase,
} from "../features/catalog/bookModel";
import { normalizePhone } from "../utils/format";
import { database } from "../services/firebaseClient";
import { ref, onValue } from "firebase/database";

const CatalogDataContext = createContext(null);
const CatalogActionsContext = createContext(null);

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

  const refreshCatalog = useCallback(async () => {
    setError("");
    setSyncing(true);

    try {
      const [rawBooks, rawOrders, rawPromos] = await Promise.all([
        fetchBooks(),
        fetchOrders(),
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

  // Real-time orders for Admin and Users
  useEffect(() => {
    const ordersRef = ref(database, "orders");
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const rawOrders = [];
      snapshot.forEach((child) => {
        rawOrders.push({ ...child.val(), fbKey: child.key });
      });
      // Sort by date descending
      setOrders(rawOrders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });
    return () => unsubscribe();
  }, []);

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

  const toggleWishlist = useCallback((bookId) => {
    setWishlistIds((prev) =>
      prev.includes(bookId)
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId],
    );
  }, [setWishlistIds]);

  const isFavorite = useCallback((bookId) => wishlistIds.includes(bookId), [wishlistIds]);

  const getBookById = useCallback((bookId) => books.find((book) => book.id === bookId), [books]);

  const upsertBook = useCallback(async ({ draft, filePayload = null, bookId = null }) => {
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
  }, [books, refreshCatalog]);

  const removeBook = useCallback(async (bookId) => {
    await deleteBook(bookId);
    await refreshCatalog();
  }, [refreshCatalog]);

  const submitOrder = useCallback(async (orderDraft) => {
    const payload = {
      ...orderDraft,
      phone: normalizePhone(orderDraft.phone),
      status: "pending",
      createdAt: Date.now(),
    };

    const response = await createOrder(payload);
    await refreshCatalog();
    return response?.name || null;
  }, [refreshCatalog]);

  const findOrdersByPhoneAndPin = useCallback(async (phone, pin) => {
    const normalized = normalizePhone(phone);
    const refreshedOrders = await fetchOrders();
    setOrders(refreshedOrders);

    return refreshedOrders.filter(
      (order) => normalizePhone(order.phone) === normalized && String(order.pin) === String(pin),
    );
  }, []);

  const setOrderStatus = useCallback(async (orderId, status) => {
    await apiUpdateOrderStatus(orderId, status);
    await refreshCatalog();
  }, [refreshCatalog]);

  const getBookFile = useCallback(async (bookId) => {
    return fetchBookFile(bookId);
  }, []);

  const addPromo = useCallback(async (promo) => {
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
  }, [refreshCatalog]);

  const togglePromo = useCallback(async (promo) => {
    await togglePromoCode(promo);
    await refreshCatalog();
  }, [refreshCatalog]);

  const removePromo = useCallback(async (promoId) => {
    await deletePromoCode(promoId);
    await refreshCatalog();
  }, [refreshCatalog]);

  const dataValue = useMemo(() => ({
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
    isFavorite,
    getBookById,
  }), [books, orders, promoCodes, loading, syncing, error, lastSyncAt, wishlistIds, favoriteBooks, totalSoldBooks, popularBooks, newBooks, isFavorite, getBookById]);

  const actionsValue = useMemo(() => ({
    refreshCatalog,
    toggleWishlist,
    upsertBook,
    removeBook,
    submitOrder,
    findOrdersByPhoneAndPin,
    setOrderStatus,
    getBookFile,
    addPromo,
    togglePromo,
    removePromo,
  }), [refreshCatalog, toggleWishlist, upsertBook, removeBook, submitOrder, findOrdersByPhoneAndPin, setOrderStatus, getBookFile, addPromo, togglePromo, removePromo]);

  return (
    <CatalogDataContext.Provider value={dataValue}>
      <CatalogActionsContext.Provider value={actionsValue}>
        {children}
      </CatalogActionsContext.Provider>
    </CatalogDataContext.Provider>
  );
}

export function useCatalogData() {
  const context = useContext(CatalogDataContext);
  if (context === undefined) {
    throw new Error("useCatalogData must be used within CatalogProvider");
  }
  return context;
}

export function useCatalogActions() {
  const context = useContext(CatalogActionsContext);
  if (context === undefined) {
    throw new Error("useCatalogActions must be used within CatalogProvider");
  }
  return context;
}

export function useCatalog() {
  const data = useCatalogData();
  const actions = useCatalogActions();
  return useMemo(() => ({ ...data, ...actions }), [data, actions]);
}

