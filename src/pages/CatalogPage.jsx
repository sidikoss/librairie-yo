import { useMemo } from "react";
import BookGrid from "../components/books/BookGrid";
import SectionHeader from "../components/ui/SectionHeader";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import { useCatalogFilters } from "../features/catalog/useCatalogFilters";

export default function CatalogPage() {
  const { addItem } = useCart();
  const {
    books,
    categories,
    loading,
    toggleWishlist,
    isFavorite,
  } = useCatalog();

  const {
    query,
    category,
    minPrice,
    maxPrice,
    sortBy,
    setQuery,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    filteredBooks,
  } = useCatalogFilters(books);

  const categoryOptions = useMemo(
    () => categories.filter((item) => item !== "Autre"),
    [categories],
  );

  const categoryRecommendations = useMemo(() => {
    if (!category) return [];
    return books
      .filter((book) => book.category === category)
      .sort((a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0))
      .slice(0, 4);
  }, [books, category]);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Catalogue"
        title="Trouvez le bon livre rapidement"
        description="Recherche dynamique, filtre prix et tri par popularité pour maximiser vos ventes."
      />

      <section className="card-surface p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un titre ou auteur"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
          >
            <option value="">Toutes les catégories</option>
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Prix min"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Prix max"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
          >
            <option value="popular">Popularité</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="newest">Nouveautés</option>
          </select>
        </div>
      </section>

      <section>
        {loading ? (
          <div className="card-surface p-6 text-center text-sm text-slate-500">
            Chargement du catalogue...
          </div>
        ) : (
          <div className="space-y-8">
            <BookGrid
              books={filteredBooks}
              onAddToCart={addItem}
              onToggleFavorite={toggleWishlist}
              isFavorite={isFavorite}
            />
            {categoryRecommendations.length ? (
              <div>
                <SectionHeader
                  eyebrow="Recommandations"
                  title={`Top ${category}`}
                  description="Livres de même catégorie recommandés selon la popularité."
                />
                <BookGrid
                  books={categoryRecommendations}
                  onAddToCart={addItem}
                  onToggleFavorite={toggleWishlist}
                  isFavorite={isFavorite}
                />
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
