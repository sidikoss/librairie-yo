import { useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import LazyImage from "../components/common/LazyImage";
import PriceTag from "../components/ui/PriceTag";
import RatingStars from "../components/ui/RatingStars";
import SectionHeader from "../components/ui/SectionHeader";
import BookSkeleton from "../components/ui/BookSkeleton";
import SEO from "../components/seo/SEO";
import { buildWhatsAppUrl } from "../features/whatsapp/whatsapp";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";

function Badge({ tone = "brand", children }) {
  const tones = {
    brand: "bg-brand-100 text-brand-700",
    new: "bg-blue-100 text-blue-700",
    promo: "bg-green-100 text-green-700",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tones[tone] || tones.brand}`}>
      {children}
    </span>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { books, loading, toggleWishlist, isFavorite } = useCatalog();

  const book = useMemo(() => {
    return books.find(b => b.id === id);
  }, [books, id]);

  const relatedBooks = useMemo(() => {
    if (!book?.category) return [];
    return books
      .filter(b => b.category === book.category && b.id !== book.id)
      .slice(0, 4);
  }, [books, book]);

  if (loading) {
    return (
      <div className="space-y-8">
        <BookSkeleton />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="font-heading text-2xl font-bold text-zinc-900">
          Livre non trouvé
        </h1>
        <p className="mt-2 text-zinc-500">
          Ce livre n'existe pas ou a été supprimé.
        </p>
        <Link
          to="/catalogue"
          className="mt-6 rounded-xl bg-brand-500 px-6 py-3 font-bold text-white"
        >
          Voir le catalogue
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(book);
  };

  return (
    <div className="space-y-8">
      <SEO
        title={book.title}
        description={book.description || `${book.title} par ${book.author}. ${book.pages} pages. Achetez sur Librairie-YO avec paiement Orange Money.`}
        image={book.image}
        product={{
          name: book.title,
          description: book.description,
          image: book.image,
          price: book.price,
          priceCurrency: "GNF",
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-zinc-500">
        <Link to="/" className="hover:text-brand-500">Accueil</Link>
        <span>/</span>
        <Link to="/catalogue" className="hover:text-brand-500">Catalogue</Link>
        <span>/</span>
        <span className="text-zinc-900">{book.title}</span>
      </nav>

      {/* Product Detail */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-book overflow-hidden rounded-2xl border border-white/40 bg-white shadow-lg">
          {book.image ? (
            <LazyImage
              src={book.image}
              alt={`Couverture de "${book.title}"`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-brand-50 to-guinea-50">
              <span className="text-8xl">{book.emoji || "📖"}</span>
              <span className="font-heading text-xl font-bold text-zinc-400">
                {book.title}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{book.category}</Badge>
            {book.isNew && <Badge tone="new">Nouveau</Badge>}
            {book.discount > 0 && <Badge tone="promo">-{book.discount}%</Badge>}
          </div>

          <h1 className="font-heading text-3xl font-bold text-zinc-900">
            {book.title}
          </h1>

          <p className="text-lg text-zinc-600">{book.author}</p>

          <div className="flex items-center gap-4">
            <PriceTag price={book.price} discount={book.discount} size="lg" />
          </div>

          <div className="flex items-center gap-2">
            <RatingStars value={book.rating || 0} />
            <span className="text-sm text-zinc-500">
              ({book.rating || 0}/5)
            </span>
          </div>

          {book.pages && (
            <p className="text-sm text-zinc-500">
              📄 {book.pages} pages
            </p>
          )}

          {book.description && (
            <p className="text-zinc-600 leading-relaxed">
              {book.description}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c1 1 1 2.5 0 3.5L9 21" />
              </svg>
              Ajouter au panier
            </button>

            <a
              href={buildWhatsAppUrl(book, 1)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-guinea-500 px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M19.05 4.94A9.94 9.94 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.51 1.34 5.04L2 22l5.1-1.33A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.95-7.06Z"/>
              </svg>
              Commander sur WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Related Books */}
      {relatedBooks.length > 0 && (
        <section>
          <SectionHeader
            eyebrow="Recommandations"
            title={`Autres livres dans "${book.category}"`}
            description="Vous aimerez peut-être ces livres."
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {relatedBooks.map(b => (
              <Link key={b.id} to={`/livre/${b.id}`} className="block">
                <div className="aspect-book overflow-hidden rounded-xl border border-white/40 bg-white shadow-soft-sm transition-all hover:-translate-y-1 hover:shadow-card-hover">
                  {b.image ? (
                    <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-brand-50 to-guinea-50">
                      <span className="text-4xl">{b.emoji || "📖"}</span>
                    </div>
                  )}
                </div>
                <h4 className="mt-2 text-sm font-bold text-zinc-900 line-clamp-2">
                  {b.title}
                </h4>
                <p className="text-xs text-zinc-500">{b.author}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
