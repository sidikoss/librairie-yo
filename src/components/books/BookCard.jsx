import { memo, useState } from "react";
import LazyImage from "../common/LazyImage";
import Badge from "../ui/Badge";
import PriceTag from "../ui/PriceTag";
import RatingStars from "../ui/RatingStars";
import SalesCounter from "../ui/SalesCounter";
import { buildBookWhatsAppUrl } from "../../features/whatsapp/whatsapp";

const BookCard = memo(function BookCard({
  book,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
}) {
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(book);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-card-lg border border-white/40 bg-white/90 shadow-soft-sm backdrop-blur-md transition-all duration-500 ease-out-expo hover:-translate-y-2 hover:shadow-card-hover"
      aria-labelledby={`book-title-${book.id}`}
    >
      {/* Cover image with optimized loading */}
      <div className="relative aspect-book overflow-hidden bg-gradient-to-br from-surface-50 via-brand-50/30 to-guinea-50/30">
        {book.image ? (
          <LazyImage
            src={book.image}
            alt={`Couverture du livre "${book.title}" par ${book.author}`}
            loadingStrategy="lazy"
            className={`h-full w-full transition-all duration-700 ease-out-expo group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2" aria-hidden="true">
            <span className="text-5xl">{book.emoji || "📖"}</span>
            <span className="font-heading text-sm font-bold text-zinc-400">
              {(book.title || "").slice(0, 15)}
            </span>
          </div>
        )}

        {!imageLoaded && book.image && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-200 animate-pulse dark:bg-zinc-700">
            <span className="text-zinc-400 dark:text-zinc-500">Chargement...</span>
          </div>
        )}

        {/* Hover overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5" role="list" aria-label="Badges du livre">
          {book.isNew ? <Badge tone="new">Nouveau</Badge> : null}
          {book.isPopular ? <Badge tone="popular">Populaire</Badge> : null}
          {book.discount > 0 ? <Badge tone="promo">Promo</Badge> : null}
        </div>

        {/* Wishlist button */}
        <button
          onClick={() => onToggleFavorite(book.id)}
 website-analysis
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

        {/* Quick WhatsApp button on hover */}
        <a
          href={buildBookWhatsAppUrl(book, 1)}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-guinea-600/90 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg backdrop-blur-sm transition-all duration-500 group-hover:opacity-100 hover:bg-guinea-600"
          aria-label={`Commander "${book.title}" via WhatsApp`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
            <path d="M19.05 4.94A9.94 9.94 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.51 1.34 5.04L2 22l5.1-1.33A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.95-7.06ZM12 20.1c-1.52 0-3-.4-4.31-1.16l-.31-.18-3.03.79.81-2.95-.2-.31A8.03 8.03 0 0 1 4 12a8 8 0 1 1 8 8.1Z"/>
          </svg>
          WhatsApp
        </a>
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-500">
          {book.category}
        </p>
        <h3
          id={`book-title-${book.id}`}
          className="font-heading text-base font-bold leading-snug text-zinc-900 transition-colors duration-300 group-hover:text-brand-700 dark:group-hover:text-brand-400 sm:text-lg"
        >
          {book.title}
        </h3>
        <p className="mb-3 text-xs text-zinc-500 sm:text-sm">{book.author}</p>

        <div className="mb-3 flex items-center justify-between gap-2">
          <PriceTag price={book.price} discount={book.discount} />
          <SalesCounter value={book.salesCount} compact />
        </div>

        <div className="mb-4">
          <RatingStars value={book.rating} />
        </div>

        {/* Add to cart button */}
        <div className="mt-auto">
          <button
 website-analysis
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
});

export default BookCard;