import { firebaseApi } from "./firebaseApi";

export async function fetchOrders() {
  const data = await firebaseApi.get("orders", 10000);
  if (!data) return [];
  return Object.entries(data)
    .map(([fbKey, value]) => ({ ...value, fbKey }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function createOrder(payload) {
  return firebaseApi.post("orders", payload);
}

export async function updateOrderStatus(orderId, status) {
  return firebaseApi.patch(`orders/${orderId}`, {
    status,
    reviewedAt: Date.now(),
  });
}

export async function fetchPromoCodes() {
  const data = await firebaseApi.get("promoCodes");
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
