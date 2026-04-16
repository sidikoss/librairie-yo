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
    </div>
  );
}
