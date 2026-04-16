import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="card-surface p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">404</p>
      <h1 className="mt-2 font-heading text-2xl font-extrabold text-slate-900">
        Page introuvable
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}
