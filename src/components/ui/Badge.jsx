export default function Badge({ children, tone = "default" }) {
  const tones = {
    default: "bg-zinc-100/90 text-zinc-700 border-zinc-200/60 dark:bg-zinc-700/90 dark:text-zinc-300 dark:border-zinc-600/60",
    new: "bg-guinea-100/90 text-guinea-700 border-guinea-200/60 dark:bg-guinea-900/90 dark:text-guinea-300 dark:border-guinea-700/60",
    popular: "bg-accent-100/90 text-accent-600 border-accent-200/60 dark:bg-accent-900/90 dark:text-accent-300 dark:border-accent-700/60",
    promo: "bg-brand-100/90 text-brand-700 border-brand-200/60 dark:bg-brand-900/90 dark:text-brand-300 dark:border-brand-700/60",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm ${tones[tone] || tones.default}`}
    >
      {children}
    </span>
  );
}
