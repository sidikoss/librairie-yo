import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="card-surface max-w-md p-10 text-center animate-scale-in">
        <span className="mb-4 block text-7xl" aria-hidden="true">🔍</span>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand-500">404</p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold text-slate-900">
          Page introuvable
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Cette page n'existe pas ou a été déplacée. Retournez à l'accueil pour continuer.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-200/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            Retour à l'accueil
          </Link>
          <Link
            to="/catalogue"
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
          >
            Catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}
