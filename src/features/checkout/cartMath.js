/**
 * Calculate cart total
 * @param {Array} items - Cart items
 * @returns {number} Total price
 */
export function calculateCartTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }
  
  return items.reduce((total, item) => {
    const price = Number(item.unitPrice || item.price || 0);
    const qty = Number(item.qty || 1);
    return total + (price * qty);
  }, 0);
}
