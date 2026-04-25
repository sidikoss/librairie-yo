import { Link } from "react-router-dom";
import { TRUST_BANNER } from "../../config/constants";
import { useCatalog } from "../../context/CatalogContext";

export default function HeroSection() {
  const { books, totalSoldBooks } = useCatalog();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/20 px-6 py-14 shadow-2xl sm:px-12 sm:py-20" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
      {/* Multi-layer gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-guinea-800" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_150%_150%_at_20%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_80%_80%,rgba(234,179,8,0.12),transparent_45%)]" />

      {/* Animated floating shapes */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-8 top-8 h-32 w-32 rounded-full border-2 border-white/8 animate-float-slow" />
        <div className="absolute -left-4 bottom-12 h-20 w-20 rounded-2xl border-2 border-white/8 rotate-12 animate-float" />
        <div className="absolute right-1/4 top-1/3 h-16 w-16 rounded-full bg-white/4 animate-float-delayed" />
        <div className="absolute left-1/3 bottom-1/4 h-24 w-24 rounded-3xl border border-accent-400/15 rotate-45 animate-float-slow" />
        <div className="absolute right-12 bottom-8 h-10 w-10 rounded-full bg-accent-400/8 animate-float" />
      </div>

      <div className="relative max-w-2xl">
        {/* Animated badge */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          <span>Librairie digitale Guinée</span>
        </div>

        {/* Title with staggered animation */}
        <h1 className="mt-5 font-heading text-3xl font-extrabold leading-[1.1] text-white drop-shadow-md sm:text-5xl lg:text-6xl opacity-0-initial animate-fade-in-up delay-200 fill-forwards">
          Achetez vos livres{" "}
          <span className="relative inline-block">
            rapidement
            <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-accent-400/60" />
          </span>
          , avec une expérience{" "}
          <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
            claire et élégante
          </span>
          .
        </h1>

        <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base opacity-0-initial animate-fade-in-up delay-400 fill-forwards">
          Catalogue mobile, paiement simple, suivi commande et livraison digitale. 
          Rejoignez des centaines de lecteurs en Guinée.
        </p>

        {/* Stats pills */}
        <div className="mt-6 flex flex-wrap gap-3 opacity-0-initial animate-fade-in-up delay-500 fill-forwards">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            <span className="text-lg" aria-hidden="true">📚</span>
            <span>{books.length || "100+"}  livres</span>
          </div>
          {totalSoldBooks > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <span className="text-lg" aria-hidden="true">🎉</span>
              <span>{totalSoldBooks}+ vendus</span>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap gap-3 opacity-0-initial animate-fade-in-up delay-600 fill-forwards">
          <Link
            to="/catalogue"
            className="group relative overflow-hidden rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-brand-700 shadow-xl shadow-brand-900/20 transition-all duration-400 hover:-translate-y-1.5 hover:bg-surface-50 hover:shadow-2xl hover:shadow-brand-900/25"
          >
            <span className="flex items-center gap-2">
              Voir le catalogue
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
          <Link
            to="/panier"
            className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-400 hover:-translate-y-1 hover:bg-white/20 hover:shadow-lg"
          >
            Commander maintenant
          </Link>
        </div>

        {/* Trust badge */}
        <div className="mt-8 opacity-0-initial animate-fade-in-up delay-700 fill-forwards">
          <p className="inline-flex items-center gap-2.5 rounded-full border border-white/40 bg-white/90 px-4 py-2 text-xs font-semibold text-zinc-800 shadow-lg backdrop-blur-sm">
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <span className="h-2 w-2 rounded-full bg-accent-500" />
              <span className="h-2 w-2 rounded-full bg-guinea-500" />
            </span>
            {TRUST_BANNER}
          </p>
        </div>
      </div>
    </section>
  );
}
