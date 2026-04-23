export default function SalesCounter({ value = 0, compact = false }) {
  const count = Number(value || 0);
  if (count <= 0) return null;
  
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-guinea-50/80 px-2.5 py-1 text-xs font-semibold text-guinea-700 ring-1 ring-guinea-100/80 backdrop-blur-sm ${
        compact ? "" : "shadow-sm"
      }`}
    >
      <span className="text-guinea-500" aria-hidden="true">🔥</span>
      <span>{count.toLocaleString("fr-FR")} vendu{count > 1 ? "s" : ""}</span>
    </div>
  );
}
