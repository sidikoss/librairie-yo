export default function SalesCounter({ value = 0, compact = false }) {
  const label = `${Number(value || 0).toLocaleString("fr-FR")} ventes`;
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-guinea-50 px-2.5 py-1 text-xs font-medium text-guinea-700 ring-1 ring-guinea-100 ${
        compact ? "" : "shadow-sm"
      }`}
    >
      <span>+</span>
      <span>{label}</span>
    </div>
  );
}
