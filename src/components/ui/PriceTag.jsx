import { formatGNF } from "../../utils/format";

export default function PriceTag({ price, discount = 0, size = "md" }) {
  const basePrice = Number(price || 0);
  const finalPrice = Math.max(0, basePrice - Number(discount || 0));

  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
    xl: "text-4xl",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (!discount) {
    return (
      <div className="flex items-baseline gap-2">
        <p className={`font-heading font-extrabold text-guinea-600 ${sizeClass}`}>
          {formatGNF(basePrice)}
        </p>
        <span className="text-xs font-medium text-zinc-500">GNF</span>
      </div>
    );
  }

  const discountPercent = Math.round((discount / basePrice) * 100);

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2">
        <p className={`font-heading font-extrabold text-brand-600 ${sizeClass}`}>
          {formatGNF(finalPrice)}
        </p>
        <span className="text-xs font-medium text-zinc-500">GNF</span>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 line-through">
          {formatGNF(basePrice)}
        </p>
        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-900 dark:text-brand-400">
          -{discountPercent}%
        </span>
      </div>
    </div>
  );
}
