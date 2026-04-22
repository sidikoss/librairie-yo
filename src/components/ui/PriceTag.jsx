import { formatGNF } from "../../utils/format";

export default function PriceTag({ price, discount = 0 }) {
  const basePrice = Number(price || 0);
  const finalPrice = Math.max(0, basePrice - Number(discount || 0));

  if (!discount) {
    return <p className="text-lg font-bold text-slate-900">{formatGNF(basePrice)}</p>;
  }

  return (
    <div>
      <p className="text-lg font-bold text-brand-600">{formatGNF(finalPrice)}</p>
      <p className="text-xs text-slate-500 line-through">{formatGNF(basePrice)}</p>
    </div>
  );
}
