import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import BookGrid from "../components/books/BookGrid";
import SectionHeader from "../components/ui/SectionHeader";
import BookSkeleton from "../components/ui/BookSkeleton";
import SEO from "../components/seo/SEO";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";

export default function CategoryPage() {
  const { category } = useParams();
  const { addItem } = useCart();
  const { books, categories, loading, toggleWishlist, isFavorite } = useCatalog();

  const categoryName = useMemo(() => {
    return decodeURIComponent(category || "");
  }, [category]);

  const filteredBooks = useMemo(() => {
    return books.filter(b => b.category === categoryName);
  }, [books, categoryName]);

  const categoryExists = categories.includes(categoryName);

  if (loading) {
    return (
      <div className="space-y-8">
        <SectionHeader
          eyebrow="Catalogue"
          title={categoryName}
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => <BookSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!categoryExists) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="font-heading text-2xl font-bold text-zinc-900">
          Catégorie non trouvée
        </h1>
        <p className="mt-2 text-zinc-500">
          Cette catégorie n'existe pas.
        </p>
        <Link
          to="/catalogue"
          className="mt-6 rounded-xl bg-brand-500 px-6 py-3 font-bold text-white"
        >
          Voir le catalogue complet
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SEO
        title={`${categoryName} - Librairie-YO`}
        description={`Découvrez notre sélection de livres ${categoryName.toLowerCase()}. Achetez vos livres numériques en Guinée avec paiement Orange Money.`}
      />

      <SectionHeader
        eyebrow="Catégorie"
        title={categoryName}
        description={`${filteredBooks.length} livre${filteredBooks.length !== 1 ? "s" : ""} disponible${filteredBooks.length !== 1 ? "s" : ""}`}
      />

      <BookGrid
        books={filteredBooks}
        onAddToCart={addItem}
        onToggleFavorite={toggleWishlist}
        isFavorite={isFavorite}
        emptyMessage="Aucun livre dans cette catégorie."
      />
    </div>
  );
}