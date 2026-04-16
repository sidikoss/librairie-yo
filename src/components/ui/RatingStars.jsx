export default function RatingStars({ value = 5 }) {
  const rounded = Math.round(Number(value || 0));
  return (
    <div className="flex items-center gap-1 text-xs text-amber-500" aria-label={`Note ${value} sur 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index}>{index < rounded ? "★" : "☆"}</span>
      ))}
      <span className="text-slate-500">{Number(value || 0).toFixed(1)}</span>
    </div>
  );
}
