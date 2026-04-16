import { Link } from "react-router-dom";
import { TRUST_BANNER } from "../../config/constants";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-brand-700 via-brand-600 to-slate-900 px-6 py-10 text-white sm:px-10 sm:py-14">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-accent-500/20 blur-2xl" />
      <div className="relative max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
          Librairie digitale Guinée
        </p>
        <h1 className="font-heading text-3xl font-extrabold leading-tight sm:text-5xl">
          Achetez vos livres en 1 minute, directement via WhatsApp.
        </h1>
        <p className="mt-4 max-w-xl text-sm text-white/85 sm:text-base">
          Catalogue optimisé mobile, paiement simple, réponse rapide et livraison digitale.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/catalogue"
            className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-brand-700 transition hover:bg-slate-100"
          >
            Voir le catalogue
          </Link>
          <Link
            to="/panier"
            className="rounded-xl border border-white/50 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Acheter maintenant
          </Link>
        </div>
        <p className="mt-6 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
          {TRUST_BANNER}
        </p>
      </div>
    </section>
  );
}
