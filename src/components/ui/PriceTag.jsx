import { formatGNF } from "../../utils/format";

export default function PriceTag({ price, discount = 0 }) {
  const basePrice = Number(price || 0);
  const finalPrice = Math.max(0, basePrice - Number(discount || 0));

  if (!discount) {
    return (
      <p className="font-heading text-lg font-extrabold text-slate-900">
        {formatGNF(basePrice)}
      </p>
    );
  }

  return (
    <div className="flex items-baseline gap-2">
      <p className="font-heading text-lg font-extrabold text-brand-600">
        {formatGNF(finalPrice)}
      </p>
      <p className="text-xs font-medium text-slate-400 line-through">
        {formatGNF(basePrice)}
      </p>
    </div>
  );
}
