import { CUSTOMER_REVIEWS, TRUST_BANNER } from "../../config/constants";
import RatingStars from "../ui/RatingStars";
import SalesCounter from "../ui/SalesCounter";

export default function CustomerTrustSection({ totalSoldBooks = 0 }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
          Confiance client
        </p>
        <h3 className="font-heading text-xl font-bold text-slate-900">
          {TRUST_BANNER}
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Service local, support WhatsApp réactif et suivi transparent des commandes.
        </p>
        <div className="mt-4">
          <SalesCounter value={totalSoldBooks} />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
          Avis clients
        </p>
        <div className="space-y-3">
          {CUSTOMER_REVIEWS.map((review) => (
            <article key={review.id} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{review.name}</p>
                <RatingStars value={review.rating} />
              </div>
              <p className="mt-1 text-sm text-slate-600">{review.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
