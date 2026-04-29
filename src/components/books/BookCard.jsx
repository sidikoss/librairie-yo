import { memo, useState } from "react";
import { Link } from "react-router-dom";
import LazyImage from "../common/LazyImage";
import PriceTag from "../ui/PriceTag";
import RatingStars from "../ui/RatingStars";
import { buildWhatsAppUrl } from "../../features/whatsapp/whatsapp";

const BookCard = memo(function BookCard({
  book,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
}) {
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
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
      {/* Cover image - clickable to view details */}
      <Link to={`/livre/${book.id}`} className="relative block aspect-book overflow-hidden bg-gradient-to-br from-surface-50 via-brand-50/30 to-guinea-50/30">
        {book.image ? (
          <LazyImage
            src={book.image}
            alt={`Couverture du livre "${book.title}" par ${book.author}`}
            loadingStrategy="lazy"
            className={`h-full w-full object-cover transition-all duration-700 ease-out-expo group-hover:scale-110 ${
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
          {book.isNew ? <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">Nouveau</span> : null}
          {book.isPopular ? <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">Populaire</span> : null}
          {book.discount > 0 ? <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-bold text-white">Promo</span> : null}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(book.id); }}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/60 text-sm shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-110 ${
            isFavorite
              ? "bg-brand-500 text-white"
              : "bg-white/90 text-zinc-500 hover:bg-brand-50 hover:text-brand-500 dark:bg-zinc-800/90 dark:text-zinc-400 dark:hover:bg-brand-900 dark:hover:text-brand-400"
          }`}
          aria-label={isFavorite ? `Retirer "${book.title}" des favoris` : `Ajouter "${book.title}" aux favoris`}
          aria-pressed={isFavorite}
        >
          <span aria-hidden="true">{isFavorite ? "♥" : "♡"}</span>
        </button>

        {/* Quick WhatsApp button on hover */}
        <a
          href={buildBookWhatsAppUrl(book, 1)}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-guinea-600/90 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-lg backdrop-blur-sm transition-all duration-500 group-hover:opacity-100 hover:bg-guinea-600"
          aria-label={`Commander "${book.title}" via WhatsApp`}
          onClick={(e) => e.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
            <path d="M19.05 4.94A9.94 9.94 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.51 1.34 5.04L2 22l5.1-1.33A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.95-7.06ZM12 20.1c-1.52 0-3-.4-4.31-1.16l-.31-.18-3.03.79.81-2.95-.2-.31A8.03 8.03 0 0 1 4 12a8 8 0 1 1 8 8.1Z"/>
          </svg>
          WhatsApp
        </a>
      </Link>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-4">
        <Link
          to={`/livre/${book.id}`}
          className="mb-1 text-[10px] font-bold uppercase tracking-widest text-brand-500 hover:text-brand-600"
        >
          {book.category}
        </Link>
        <h3
          id={`book-title-${book.id}`}
          className="font-heading text-base font-bold leading-snug text-zinc-900 transition-colors duration-300 group-hover:text-brand-700 dark:group-hover:text-brand-400 sm:text-lg"
        >
          <Link to={`/livre/${book.id}`} className="hover:text-brand-600">
            {book.title}
          </Link>
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
            onClick={handleAddToCart}
            disabled={isAdded}
            className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
              isAdded 
                ? "bg-guinea-500 text-white shadow-guinea-200/40" 
                : "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-brand-200/30 hover:shadow-brand-200/40"
            }`}
            aria-label={`Ajouter "${book.title}" au panier`}
          >
            {isAdded ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ajouté!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter au panier
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
});

export default BookCard;