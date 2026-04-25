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

      {/* Cart summary */}
      <section className="card-surface overflow-hidden">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total ({items.length} article{items.length > 1 ? "s" : ""})</p>
            <p className="font-heading text-2xl font-extrabold text-zinc-900 dark:text-white">{formatGNF(total)}</p>
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <Link
            to="/checkout"
            className="rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-900 px-5 py-3 text-center text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:from-zinc-700 dark:to-zinc-800"
          >
            Continuer vers checkout
          </Link>
          <button
            onClick={() => { if (window.confirm("Êtes-vous sûr de vouloir vider votre panier ?")) clearCart(); }}
            className="rounded-xl border border-zinc-200 px-5 py-3 text-sm font-medium text-zinc-600 transition-all duration-200 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Vider le panier
          </button>
        </div>
      </section>
    </div>
  );
}
