import { Link } from "react-router-dom";
import { TRUST_BANNER } from "../../config/constants";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 px-6 py-12 shadow-soft sm:px-10 sm:py-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-accent-500 to-guinea-600 opacity-95" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/95 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_84%_26%,rgba(255,255,255,0.3),transparent_35%)]" />
      
      {/* Animated floating books decoration */}
      <div className="absolute right-6 top-6 hidden animate-bounce text-4xl opacity-20 sm:block" style={{ animationDuration: "3s" }} aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <div className="absolute bottom-20 right-20 hidden animate-pulse text-4xl opacity-15 sm:block" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
        </svg>
      </div>

      <div className="relative mt-8 max-w-2xl sm:mt-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
          </span>
          <span>Librairie digitale Guinee</span>
        </div>
        
        {/* Title with text-balance */}
        <h1 className="mt-5 text-balance font-heading text-3xl font-extrabold leading-tight text-white sm:text-5xl">
          Achetez vos livres rapidement, avec une experience claire et elegante.
        </h1>
        
        {/* Subtitle */}
        <p className="mt-4 max-w-xl text-pretty text-sm text-white/90 sm:text-base">
          Catalogue mobile, paiement Orange Money, suivi de commande et livraison digitale partout en Guinee.
        </p>
        
        {/* Features list */}
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/80">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Paiement securise
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Livraison rapide
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Support WhatsApp
          </span>
        </div>
        
        {/* CTA buttons */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/catalogue"
            className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand-700 shadow-lg shadow-brand-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            Voir le catalogue
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            to="/panier"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white/50 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Commander maintenant
          </Link>
        </div>
        
        {/* Trust badge */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-800 shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-guinea-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          {TRUST_BANNER}
        </div>
      </div>
    </section>
  );
}
