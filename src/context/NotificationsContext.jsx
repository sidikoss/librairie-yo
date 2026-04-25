import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const NotificationsContext = createContext(null);

const DEFAULT_NOTIFICATIONS = [
  {
    id: "n1",
    type: "order",
    title: "Commande confirmée",
    body: "Votre commande #123 a été confirmée",
    read: false,
    createdAt: Date.now() - 3600000,
  },
  {
    id: "n2",
    type: "promo",
    title: "Flash Sale!",
    body: "-20% sur tous les romans ce weekend",
    read: false,
    createdAt: Date.now() - 7200000,
  },
  {
    id: "n3",
    type: "system",
    title: "Bienvenue",
    body: "Merci de rejoindre Librairie YO",
    read: true,
    createdAt: Date.now() - 86400000,
  },
];

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [permission, setPermission] = useState("default");
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      return "denied";
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.REACT_APP_VAPID_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
        ),
      });

      setSubscription(pushSubscription);
      return pushSubscription;
    } catch (error) {
      console.error("[Notifications] Subscribe failed:", error);
      return null;
    }
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
    } catch (error) {
      console.error("[Notifications] Unsubscribe failed:", error);
    }
  }, [subscription]);

  const showLocalNotification = useCallback((title, options = {}) => {
    if (permission !== "granted") return;

    const notification = new Notification(title, {
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      ...options,
    });

    return notification;
  }, [permission]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: `n-${Date.now()}`,
      read: false,
      createdAt: Date.now(),
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    showLocalNotification(newNotification.title, {
      body: newNotification.body,
      tag: newNotification.type,
    });

    return newNotification;
  }, [showLocalNotification]);

  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  }, []);

  const deleteNotification = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.filter((n) => n.id !== notificationId)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const value = {
    notifications,
    permission,
    subscription,
    unreadCount,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    showLocalNotification,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return context;
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}