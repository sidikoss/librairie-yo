import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "../config/constants";

const OrdersContext = createContext(null);

const DEFAULT_ORDERS = [];

function getStoredOrders() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.orders);
    return stored ? JSON.parse(stored) : DEFAULT_ORDERS;
  } catch {
    return DEFAULT_ORDERS;
  }
}

function saveOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  } catch (error) {
    console.warn("[Orders] Failed to save:", error);
  }
}

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrders(getStoredOrders());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveOrders(orders);
    }
  }, [orders, loading]);

  const createOrder = useCallback((orderData) => {
    const newOrder = {
      id: `cmd-${Date.now()}`,
      createdAt: Date.now(),
      status: "pending",
      ...orderData,
    };

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, []);

  const updateOrderStatus = useCallback((orderId, status) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status, updatedAt: Date.now() } : order
      )
    );
  }, []);

  const getOrderById = useCallback(
    (orderId) => orders.find((o) => o.id === orderId),
    [orders]
  );

  const getOrdersByStatus = useCallback(
    (status) => orders.filter((o) => o.status === status),
    [orders]
  );

  const getRecentOrders = useCallback(
    (limit = 10) => orders.slice(0, limit),
    [orders]
  );

  const getTotalSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  const cancelOrder = useCallback((orderId) => {
    updateOrderStatus(orderId, "cancelled");
  }, [updateOrderStatus]);

  const value = {
    orders,
    loading,
    createOrder,
    updateOrderStatus,
    getOrderById,
    getOrdersByStatus,
    getRecentOrders,
    getTotalSpent,
    cancelOrder,
  };

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (!context) {
    throw new Error("useOrders must be used within OrdersProvider");
  }
  return context;
}