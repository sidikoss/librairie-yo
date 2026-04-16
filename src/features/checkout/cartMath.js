export function calculateCartTotal(items) {
  return (items || []).reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * Number(item.qty || 0),
    0,
  );
}
