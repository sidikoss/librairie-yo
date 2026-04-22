export default function Badge({ children, tone = "default" }) {
  const tones = {
    default: "bg-slate-100 text-slate-700",
    new: "bg-guinea-100 text-guinea-700",
    popular: "bg-accent-100 text-accent-600",
    promo: "bg-brand-100 text-brand-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${tones[tone] || tones.default}`}
    >
      {children}
    </span>
  );
}
