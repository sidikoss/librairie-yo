export default function SalesCounter({ value = 0, compact = false }) {
  const formattedValue = Number(value || 0).toLocaleString("fr-FR");
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-guinea-50 to-guinea-100 px-3 py-1.5 text-xs font-semibold text-guinea-700 ring-1 ring-guinea-200 ${
        compact ? "px-2 py-1" : "shadow-sm"
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} text-guinea-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      <span>{formattedValue}</span>
      <span className={compact ? "hidden" : ""}>ventes</span>
    </div>
  );
}
