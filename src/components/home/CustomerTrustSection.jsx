import { useEffect, useState } from "react";
import { CUSTOMER_REVIEWS, TRUST_BANNER } from "../../config/constants";
import RatingStars from "../ui/RatingStars";

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
    <section className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
      {/* Trust card */}
      <div className="card-surface p-6 transition-all duration-300 hover:shadow-warm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">
          Confiance client
        </p>
        <h3 className="font-heading text-2xl font-bold text-zinc-900 dark:text-white">{TRUST_BANNER}</h3>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Service local, support reactif et suivi transparent de chaque commande.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-guinea-50 to-guinea-100 px-4 py-2.5 text-sm font-bold text-guinea-700 shadow-sm">
            <span className="text-lg" aria-hidden="true">📦</span>
            <span>
              <AnimatedCounter target={totalSoldBooks} /> livres vendus
            </span>
          </div>
          <span className="flag-chip">
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <span className="h-2 w-2 rounded-full bg-accent-500" />
              <span className="h-2 w-2 rounded-full bg-guinea-500" />
            </span>
            Paiement sécurisé
          </span>
        </div>
      </div>

      {/* Reviews card */}
      <div className="card-surface p-6">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">
          Avis clients
        </p>
        <div className="space-y-3">
          {CUSTOMER_REVIEWS.map((review, index) => (
            <article
              key={review.id}
              className="group rounded-xl border border-zinc-100/80 bg-gradient-to-r from-white via-accent-50/40 to-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:from-zinc-800 dark:via-zinc-800/50 dark:to-zinc-800"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-accent-100 text-xs font-bold text-brand-700 dark:from-brand-900 dark:to-accent-900 dark:text-brand-400">
                    {review.name.charAt(0)}
                  </div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{review.name}</p>
                </div>
                <RatingStars value={review.rating} />
              </div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{review.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
