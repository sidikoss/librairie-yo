import { useEffect, useState } from "react";
import { CUSTOMER_REVIEWS, TRUST_BANNER } from "../../config/constants";
import RatingStars from "../ui/RatingStars";
import SalesCounter from "../ui/SalesCounter";

function AnimatedCounter({ target }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target || target <= 0) return;
    const duration = 1500;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count}</span>;
}

export default function CustomerTrustSection({ totalSoldBooks = 0 }) {
  return (
 website-analysis
    <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      {/* Trust card */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-6 shadow-soft transition-all duration-300 hover:shadow-warm">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 opacity-50 transition-transform duration-500 group-hover:scale-150" aria-hidden="true" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">Confiance client</span>
          </div>
          <h3 className="font-heading text-xl font-bold text-slate-900">{TRUST_BANNER}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Service local, support reactif et suivi transparent de chaque commande.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <SalesCounter value={totalSoldBooks} />
            <span className="inline-flex items-center gap-2 rounded-full border border-guinea-200 bg-guinea-50 px-3 py-1.5 text-xs font-semibold text-guinea-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Paiement securise
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent-300 bg-accent-100 px-3 py-1.5 text-xs font-semibold text-accent-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Livraison rapide
            </span>
          </div>
        </div>
      </div>
      
      {/* Reviews card */}
      <div className="rounded-2xl border border-white/70 bg-white/95 p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-100 px-3 py-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-accent-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">Avis clients</span>
          </div>
          <span className="text-xs text-slate-500">{CUSTOMER_REVIEWS.length} avis verifies</span>
        </div>

        <div className="space-y-3">
          {CUSTOMER_REVIEWS.map((review, index) => (
            <article
              key={review.id}
 website-analysis
              className="group/review rounded-xl border border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white p-3 transition-all duration-200 hover:border-accent-200 hover:shadow-sm"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-accent-100 text-xs font-bold text-brand-700">
                    {review.name.charAt(0)}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{review.name}</p>
                </div>
                <RatingStars value={review.rating} />
              </div>
              <p className="mt-2 pl-10 text-sm leading-relaxed text-slate-600">{review.text}</p>

            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
