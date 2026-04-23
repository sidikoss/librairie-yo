export default function Badge({ children, tone = "default" }) {
  const tones = {
    default: "bg-slate-100/90 text-slate-700 border-slate-200/60",
    new: "bg-guinea-100/90 text-guinea-700 border-guinea-200/60",
    popular: "bg-accent-100/90 text-accent-600 border-accent-200/60",
    promo: "bg-brand-100/90 text-brand-700 border-brand-200/60",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm ${tones[tone] || tones.default}`}
    >
      {children}
    </span>
  );
}
