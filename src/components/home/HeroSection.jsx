import { Link } from "react-router-dom";
import { useCatalog } from "../../context/CatalogContext";
import { buildWhatsAppUrl } from "../../features/whatsapp/whatsapp";
import { TRUST_BANNER, WA_NUMBER } from "../../config/constants";

export default function HeroSection() {
  const { books, totalSoldBooks } = useCatalog();
  const waUrl = WA_NUMBER ? `https://wa.me/${WA_NUMBER.replace(/^0/, '224')}` : null;

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
        {/* Urgency badge */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-guinea-400/60 bg-guinea-600/40 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-guinea-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-guinea-400" />
          </span>
          <span>Livraison immédiate après paiement</span>
        </div>

        {/* Main Title - Conversion oriented */}
        <h1 className="mt-5 font-heading text-3xl font-extrabold leading-[1.1] text-white drop-shadow-md sm:text-5xl lg:text-6xl opacity-0-initial animate-fade-in-up delay-200 fill-forwards">
          Votre livre idéal,{" "}
          <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">
            immédiatement
          </span>
          {" "}après paiement.
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg opacity-0-initial animate-fade-in-up delay-400 fill-forwards">
          <strong className="text-accent-300">Paiement simple</strong> via Orange Money.{" "}
          <strong className="text-accent-300">Livraison instantanée</strong> par WhatsApp.{" "}
          Rejoignez <strong className="text-white">{totalSoldBooks || "500+"} lecteurs</strong> satisfaits.
        </p>

        {/* Conversion-focused CTA */}
        <div className="mt-8 flex flex-wrap gap-3 opacity-0-initial animate-fade-in-up delay-500 fill-forwards">
          <Link
            to="/catalogue"
            className="group flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-brand-700 shadow-xl shadow-brand-900/20 transition-all duration-400 hover:-translate-y-1.5 hover:bg-surface-50 hover:shadow-2xl hover:shadow-brand-900/25"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Voir le catalogue
          </Link>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl bg-guinea-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-guinea-600/30 transition-all duration-400 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-guinea-600/40"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M19.05 4.94A9.94 9.94 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.51 1.34 5.04L2 22l5.1-1.33A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.95-7.06Z"/>
              </svg>
              Commander sur WhatsApp
            </a>
          )}
        </div>

        {/* Trust indicators */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/80 opacity-0-initial animate-fade-in-up delay-600 fill-forwards">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Paiement sécurisé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Livraison immédiate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Support WhatsApp</span>
          </div>
        </div>

        {/* Stats pills */}
        <div className="mt-6 flex flex-wrap gap-3 opacity-0-initial animate-fade-in-up delay-700 fill-forwards">
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

        {/* Trust badge */}
        <div className="mt-8 opacity-0-initial animate-fade-in-up delay-800 fill-forwards">
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
