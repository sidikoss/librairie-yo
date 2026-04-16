import { Link } from "react-router-dom";
import SectionHeader from "../components/ui/SectionHeader";
import { useCart } from "../context/CartContext";
import { buildCartWhatsAppUrl } from "../features/whatsapp/whatsapp";
import { formatGNF } from "../utils/format";

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();

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

  const whatsappUrl = buildCartWhatsAppUrl(items);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Panier"
        title="Finalisez votre commande"
        description="Ajustez les quantités puis commandez directement via WhatsApp."
      />

      <section className="card-surface divide-y divide-slate-200">
        {items.map((item) => (
          <div key={item.bookId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
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
                  <div className="flex h-full w-full items-center justify-center text-xl">📘</div>
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-sm text-slate-500">{formatGNF(item.unitPrice)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.bookId, item.qty - 1)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm"
              >
                -
              </button>
              <span className="min-w-8 text-center text-sm font-semibold">{item.qty}</span>
              <button
                onClick={() => updateQuantity(item.bookId, item.qty + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm"
              >
                +
              </button>
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

      <section className="card-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-xl font-extrabold text-slate-900">{formatGNF(total)}</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-[#25D366] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#1ebd59]"
          >
            Commander via WhatsApp
          </a>
          <Link
            to="/checkout"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Continuer vers checkout
          </Link>
          <button
            onClick={clearCart}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Vider le panier
          </button>
        </div>
      </section>
    </div>
  );
}
