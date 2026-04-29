export function calculateCartTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }

  return items.reduce((total, item) => {
    const unitPrice = Number(item?.unitPrice ?? item?.price ?? 0);
    const quantity = Number(item?.qty ?? 1);

    if (!Number.isFinite(unitPrice) || !Number.isFinite(quantity)) {
      return total;
    }

    return total + unitPrice * quantity;
  }, 0);
}
