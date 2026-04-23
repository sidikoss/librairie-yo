import { Link } from "react-router-dom";
import BookGrid from "../components/books/BookGrid";
import SectionHeader from "../components/ui/SectionHeader";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";

export default function FavoritesPage() {
  const { addItem } = useCart();
  const { favoriteBooks, toggleWishlist, isFavorite } = useCatalog();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Favoris"
        title="Vos livres favoris"
        description="Retrouvez rapidement les livres que vous souhaitez commander."
      />

      <BookGrid
        books={favoriteBooks}
        onAddToCart={addItem}
        onToggleFavorite={toggleWishlist}
        isFavorite={isFavorite}
        emptyMessage="Vous n'avez pas encore ajouté de favoris."
      />

      {favoriteBooks.length === 0 && (
        <div className="card-surface flex flex-col items-center gap-4 p-10 text-center animate-fade-in">
          <span className="text-6xl" aria-hidden="true">♡</span>
          <p className="max-w-sm text-sm leading-relaxed text-slate-500">
            Parcourez le catalogue et appuyez sur le cœur pour sauvegarder vos livres préférés ici.
          </p>
          <Link
            to="/catalogue"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-200/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            Explorer le catalogue
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
