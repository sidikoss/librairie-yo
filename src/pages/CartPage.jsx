import { Link } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import SEO from "../components/seo/SEO";
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
        <div className="card-surface p-10 text-center">
          <span className="mb-4 block text-6xl" aria-hidden="true">🛒</span>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">Aucun livre dans votre panier</p>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-200/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            Parcourir le catalogue
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SEO 
        title="Mon Panier" 
        description="Consultez les livres dans votre panier et finalisez votre commande." 
      />
      <SectionHeader
        eyebrow="Panier"
        title="Finalisez votre commande"
        description="Chaque livre peut être commandé une seule fois."
      />

      {/* Cart items */}
      <section className="card-surface divide-y divide-slate-100">
        {items.map((item, index) => (
          <div
            key={item.bookId}
            className="flex flex-col gap-3 p-5 transition-colors duration-200 hover:bg-slate-50/50 sm:flex-row sm:items-center sm:justify-between opacity-0-initial animate-fade-in-up fill-forwards"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="h-16 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-50 to-accent-50 shadow-sm">
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
                    📖
                  </div>
                )}
              </div>
              <div>
                <p className="font-heading font-bold text-zinc-800 dark:text-white">{item.title}</p>
                <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">{formatGNF(item.unitPrice)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="rounded-lg border border-zinc-200/80 bg-zinc-50/80 px-3 py-1.5 text-xs font-semibold text-zinc-500 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                Achat unique
              </span>
              <button
                onClick={() => removeItem(item.bookId)}
                className="rounded-lg border border-brand-200/60 bg-brand-50/50 px-3 py-1.5 text-xs font-semibold text-brand-600 transition-all duration-200 hover:bg-brand-100 hover:shadow-sm dark:border-brand-700 dark:bg-brand-900/50 dark:text-brand-400 dark:hover:bg-brand-900"
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
      </section>

 website-analysis
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
