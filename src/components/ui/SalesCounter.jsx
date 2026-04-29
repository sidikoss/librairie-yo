export default function SalesCounter({ value = 0, compact = false }) {
  const sales = Math.max(0, Number(value || 0));

  if (compact) {
    return (
      <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {sales}+ ventes
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      <span aria-hidden="true">🔥</span>
      <span>{sales}+ ventes</span>
    </div>
  );
}
