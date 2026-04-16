import { Link } from "react-router-dom";
import Badge from "../ui/Badge";
import PriceTag from "../ui/PriceTag";
import RatingStars from "../ui/RatingStars";
import SalesCounter from "../ui/SalesCounter";
import { buildBookWhatsAppUrl } from "../../features/whatsapp/whatsapp";

export default function BookCard({
  book,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        {book.image ? (
          <img
            src={book.image}
            alt={book.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            width={300}
            height={400}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-100 to-slate-100 text-5xl">
            {book.emoji || "📚"}
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {book.isNew ? <Badge tone="new">Nouveau</Badge> : null}
          {book.isPopular ? <Badge tone="popular">Populaire</Badge> : null}
          {book.discount > 0 ? <Badge tone="promo">Promo</Badge> : null}
        </div>

        <button
          onClick={() => onToggleFavorite(book.id)}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-sm shadow"
          aria-label="Ajouter aux favoris"
        >
          {isFavorite ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
          {book.category}
        </p>
        <h3 className="line-clamp-2 font-heading text-lg font-bold text-slate-900">
          {book.title}
        </h3>
        <p className="mb-3 text-sm text-slate-500">{book.author}</p>
        <div className="mb-3 flex items-center justify-between gap-2">
          <PriceTag price={book.price} discount={book.discount} />
          <SalesCounter value={book.salesCount} compact />
        </div>
        <div className="mb-4">
          <RatingStars value={book.rating} />
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={() => onAddToCart(book)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Acheter maintenant
          </button>
          <a
            href={buildBookWhatsAppUrl(book, 1)}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-[#25D366] px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#1ebd59]"
          >
            Commander via WhatsApp
          </a>
          <Link
            to="/checkout"
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Voir le checkout
          </Link>
        </div>
      </div>
    </article>
  );
}
