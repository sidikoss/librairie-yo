import { Link } from "react-router-dom";
import { TRUST_BANNER } from "../../config/constants";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 px-6 py-10 shadow-soft sm:px-10 sm:py-14">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-accent-500 to-guinea-600 opacity-95" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-white/88" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_84%_26%,rgba(255,255,255,0.3),transparent_35%)]" />
      <div className="relative mt-10 max-w-2xl sm:mt-12">
        <div className="flag-chip border-white/40 bg-white/15 text-white">
          <span className="h-2 w-2 rounded-full bg-white/95" />
          <span>Librairie digitale Guinée</span>
        </div>
        <h1 className="mt-4 font-heading text-3xl font-extrabold leading-tight text-white sm:text-5xl">
          Achetez vos livres rapidement, avec une expérience claire et élégante.
        </h1>
        <p className="mt-4 max-w-xl text-sm text-slate-900 sm:text-base">
          Catalogue mobile, paiement simple, suivi commande et livraison digitale.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/catalogue"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 shadow-md shadow-brand-200 transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Voir le catalogue
          </Link>
          <Link
            to="/panier"
            className="rounded-xl border border-white/70 bg-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/30"
          >
            Commander maintenant
          </Link>
        </div>
        <p className="mt-6 inline-flex rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-800">
          {TRUST_BANNER}
        </p>
      </div>
    </section>
  );
}
