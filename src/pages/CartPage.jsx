import { Link } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import { useCart } from "../context/CartContext";
import { formatGNF } from "../utils/format";

export default function CartPage() {
  const { items, total, removeItem, clearCart } = useCart();

  if (!items.length) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Panier"
          title="Votre panier est vide"
          description="Ajoutez des livres depuis le catalogue pour commander."
        />
        <Link
          to="/catalogue"
          className="inline-flex rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Parcourir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Panier"
        title="Finalisez votre commande"
        description="Chaque livre peut etre commande une seule fois."
      />

      <section className="card-surface divide-y divide-slate-200">
        {items.map((item) => (
          <div
            key={item.bookId}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-14 w-12 overflow-hidden rounded bg-slate-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    width={80}
                    height={100}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl">
                    Livre
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500">{formatGNF(item.unitPrice)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Achat unique
              </span>
              <button
                onClick={() => removeItem(item.bookId)}
                className="ml-2 rounded-lg border border-rose-200 px-3 py-1 text-sm text-rose-600"
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-soft">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Total de la commande</p>
            <p className="text-2xl font-extrabold text-slate-900">{formatGNF(total)}</p>
          </div>
        </div>
        <div className="p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/checkout"
              className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Payer avec Orange Money
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <button
              onClick={clearCart}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Vider le panier
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
