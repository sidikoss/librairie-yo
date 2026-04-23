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
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Catalogue"
        title="Trouvez le bon livre rapidement"
        description="Recherche dynamique, filtre prix et tri par popularité pour maximiser vos ventes."
      />

      {/* Filter section */}
      <section className="card-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-500">Filtres</p>
          {(query || category || minPrice || maxPrice) && (
            <button
              onClick={() => { setQuery(""); setCategory(""); setMinPrice(""); setMaxPrice(""); }}
              className="ml-auto text-xs font-medium text-slate-400 transition-colors hover:text-brand-500"
            >
              Réinitialiser
            </button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un titre ou auteur"
              className="input-premium w-full pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="input-premium w-full"
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
            placeholder="Prix min (GNF)"
            className="input-premium w-full"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Prix max (GNF)"
            className="input-premium w-full"
          />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="input-premium w-full"
          >
            <option value="popular">Popularité</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
            <option value="newest">Nouveautés</option>
          </select>
        </div>

        {/* Results count */}
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-guinea-500" />
          <p className="text-xs text-slate-400">
            {filteredBooks.length} livre{filteredBooks.length !== 1 ? "s" : ""} trouvé{filteredBooks.length !== 1 ? "s" : ""}
          </p>
        </div>
      </section>

      {/* Results */}
      <section>
        {loading ? (
          <div className="card-surface p-8 text-center">
            <div className="inline-flex items-center gap-3 text-sm text-slate-500">
              <svg className="h-5 w-5 animate-spin text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Chargement du catalogue...
            </div>
          </div>
        ) : (
          <div className="space-y-10">
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
