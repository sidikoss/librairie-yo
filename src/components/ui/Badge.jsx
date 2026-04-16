export default function Badge({ children, tone = "default" }) {
  const tones = {
    default: "bg-slate-100 text-slate-700",
    new: "bg-emerald-100 text-emerald-700",
    popular: "bg-amber-100 text-amber-700",
    promo: "bg-rose-100 text-rose-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] || tones.default}`}
    >
      {children}
    </span>
  );
}
