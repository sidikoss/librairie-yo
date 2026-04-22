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
      {favoriteBooks.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-5 text-center">
          <p className="text-sm text-slate-600">
            Parcourez le catalogue et ajoutez des livres pour les retrouver ici.
          </p>
          <Link
            to="/catalogue"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Aller au catalogue
          </Link>
        </div>
      ) : null}
    </div>
  );
}
