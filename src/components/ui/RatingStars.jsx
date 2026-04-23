export default function RatingStars({ value = 5 }) {
  const rounded = Math.round(Number(value || 0));
  return (
    <div className="flex items-center gap-0.5 text-xs" aria-label={`Note ${value} sur 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={`transition-all duration-200 ${
            index < rounded
              ? "text-accent-500 drop-shadow-sm"
              : "text-slate-300"
          }`}
        >
          ★
        </span>
      ))}
      <span className="ml-1 text-[10px] font-semibold text-slate-400">
        {Number(value || 0).toFixed(1)}
      </span>
    </div>
  );
}
