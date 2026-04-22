import { CUSTOMER_REVIEWS, TRUST_BANNER } from "../../config/constants";
import RatingStars from "../ui/RatingStars";
import SalesCounter from "../ui/SalesCounter";

export default function CustomerTrustSection({ totalSoldBooks = 0 }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="card-surface p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
          Confiance client
        </p>
        <h3 className="font-heading text-xl font-bold text-slate-900">{TRUST_BANNER}</h3>
        <p className="mt-2 text-sm text-slate-600">
          Service local, support réactif et suivi transparent de chaque commande.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SalesCounter value={totalSoldBooks} />
          <span className="flag-chip">
            <span className="h-2 w-2 rounded-full bg-guinea-600" />
              Paiement sécurisé
          </span>
        </div>
      </div>
      <div className="card-surface p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">
          Avis clients
        </p>
        <div className="space-y-3">
          {CUSTOMER_REVIEWS.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-slate-200 bg-gradient-to-r from-white via-accent-100/40 to-white p-3"
            >
              <div className="flex items-center justify-between gap-2">
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
