import { firebaseApi } from "./firebaseApi";
import { STORAGE_KEYS } from "../config/constants";

function getAdminToken() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.adminSession);
    return raw ? JSON.parse(raw)?.token || null : null;
  } catch {
    return null;
  }
}

async function fetchOrdersFromAdminApi() {
  const token = getAdminToken();
  if (!token) return [];

  const res = await fetch("/api/admin?action=get-orders", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok || !Array.isArray(data.orders)) return [];
  return data.orders;
}

export async function fetchOrders() {
  const orders = await fetchOrdersFromAdminApi();
  return orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function fetchOrdersFresh() {
  return fetchOrders();
}

export async function createOrder(payload) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return data?.orderId ? { name: data.orderId } : null;
}

export async function updateOrderStatus(orderId, status) {
  const token = getAdminToken();
  if (!token) return null;
  const res = await fetch("/api/admin?action=update-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ orderId, status }),
  });
  return res.ok ? res.json().catch(() => ({})) : null;
}

export async function fetchPromoCodes() {
  const data = await firebaseApi.get("promoCodes", 10000, {
    silentStatuses: [401, 403],
  });
  if (!data) return [];
  return Object.entries(data)
    .map(([fbKey, value]) => ({ ...value, fbKey }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function createPromoCode(payload) {
  return firebaseApi.post("promoCodes", payload);
}

export async function togglePromoCode(promo) {
  return firebaseApi.patch(`promoCodes/${promo.fbKey}`, {
    active: !promo.active,
  });
}

export async function deletePromoCode(promoId) {
  return firebaseApi.del(`promoCodes/${promoId}`);
}

export function buildSalesByBookMap(orders) {
  return orders
    .filter((order) => order.status === "approved")
    .reduce((acc, order) => {
      for (const item of order.items || []) {
        const key = item.bookId || item.fbKey || item.id;
        if (!key) continue;
        acc[key] = (acc[key] || 0) + Number(item.qty || 1);
      }
      return acc;
    }, {});
}
