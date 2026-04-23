import { Link } from "react-router-dom";
import { TRUST_BANNER } from "../../config/constants";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/60 px-6 py-12 shadow-soft sm:px-10 sm:py-16">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-accent-500 to-guinea-600" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_84%_26%,rgba(255,255,255,0.3),transparent_35%)]" />
      <div className="absolute inset-0 bg-slate-900/15" />
      <div className="relative max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-white" />
          <span>Librairie digitale Guinée</span>
        </div>
        <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-white drop-shadow-sm sm:text-5xl">
          Achetez vos livres rapidement, avec une expérience claire et élégante.
        </h1>
        <p className="mt-4 max-w-xl text-sm text-white/95 sm:text-base">
          Catalogue mobile, paiement simple, suivi commande et livraison digitale.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/catalogue"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 shadow-md shadow-brand-900/20 transition hover:-translate-y-0.5 hover:bg-slate-50"
          >
            Voir le catalogue
          </Link>
          <Link
            to="/panier"
            className="rounded-xl bg-slate-900/85 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-slate-900"
          >
            Commander maintenant
          </Link>
        </div>
        <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">
          <span className="h-2 w-2 rounded-full bg-guinea-600" />
          {TRUST_BANNER}
        </p>
      </div>
    </section>
  );
}
