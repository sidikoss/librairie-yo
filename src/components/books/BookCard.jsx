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
    <article 
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 shadow-soft transition duration-300 hover:-translate-y-1.5 hover:shadow-warm"
      aria-labelledby={`book-title-${book.id}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-brand-50 via-accent-100/60 to-guinea-50">
        {book.image ? (
          <img
            src={book.image}
            alt={`Couverture du livre "${book.title}" par ${book.author}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            width={300}
            height={400}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl text-brand-700" aria-hidden="true">
            {book.emoji || "Livre"}
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5" role="list" aria-label="Badges du livre">
          {book.isNew ? <Badge tone="new">Nouveau</Badge> : null}
          {book.isPopular ? <Badge tone="popular">Populaire</Badge> : null}
          {book.discount > 0 ? <Badge tone="promo">Promo</Badge> : null}
        </div>

        <button
          onClick={() => onToggleFavorite(book.id)}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border shadow-md backdrop-blur-sm transition-all duration-200 ${
            isFavorite 
              ? "border-brand-200 bg-brand-50 text-brand-600" 
              : "border-white/70 bg-white/95 text-slate-400 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-500"
          }`}
          aria-label={isFavorite ? `Retirer "${book.title}" des favoris` : `Ajouter "${book.title}" aux favoris`}
          aria-pressed={isFavorite}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
          {book.category}
        </p>
        <h3 id={`book-title-${book.id}`} className="line-clamp-2 font-heading text-lg font-bold text-slate-900">
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
            className="group/btn flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-lg active:translate-y-0"
            aria-label={`Ajouter "${book.title}" au panier`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Ajouter au panier
          </button>
          <a
            href={buildBookWhatsAppUrl(book, 1)}
            target="_blank"
            rel="noopener noreferrer"
            className="group/wa flex items-center justify-center gap-2 rounded-xl bg-guinea-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-guinea-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-guinea-700 hover:shadow-lg active:translate-y-0"
            aria-label={`Commander "${book.title}" via WhatsApp (ouvre dans un nouvel onglet)`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
    </article>
  );
}
