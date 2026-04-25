import { memo } from "react";
import { useRecommendations } from "../context/RecommendationsContext";
import { useCatalog } from "../context/CatalogContext";

const RecommendationGrid = memo(function RecommendationGrid({ currentBookId, limit = 8 }) {
  const { getBooks } = useCatalog();
  const { getViewedCategories, getViewedAuthors, getRecentlyViewed } = useRecommendations();

  const books = getBooks();

  const recommendations = useMemo(() => {
    const viewedCategories = getViewedCategories();
    const viewedAuthors = getViewedAuthors();
    const recent = getRecentlyViewed();

    const scored = books
      .filter((book) => book.id !== currentBookId)
      .map((book) => {
        let score = 0;

        if (viewedCategories.includes(book.category)) score += 10;
        if (viewedAuthors.includes(book.author)) score += 15;
        if (recent.some((r) => r.id === book.id)) score += 5;

        if (book.rating >= 4) score += 3;
        if (book.price < 10000) score += 2;

        return { ...book, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }, [books, currentBookId, viewedCategories, viewedAuthors, recent, limit]);

  if (recommendations.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {recommendations.map((book) => (
        <BookRecommendationCard key={book.id} book={book} />
      ))}
    </div>
  );
});

const BookRecommendationCard = memo(function BookRecommendationCard({ book }) {
  return (
    <a
      href={`/catalogue?id=${book.id}`}
      className="group block bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all hover:shadow-md"
    >
      <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
        {book.cover ? (
          <img
            src={book.cover}
            alt={book.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
          </div>
        )}
        {book.discount > 0 && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-md">
            -{book.discount}%
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-2 group-hover:text-brand-600 transition-colors">
          {book.title}
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {book.author}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
            {book.price.toLocaleString()} GNF
          </span>
          {book.rating && (
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <svg className="h-3 w-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {book.rating}
            </div>
          )}
        </div>
      </div>
    </a>
  );
});

const RecentlyViewedSection = memo(function RecentlyViewedSection({ limit = 6 }) {
  const { getRecentlyViewed } = useRecommendations();
  const recent = getRecentlyViewed(limit);

  if (recent.length === 0) return null;

  return (
    <section className="py-8">
      <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
        Vus récemment
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {recent.map((book) => (
          <a
            key={book.id}
            href={`/catalogue?id=${book.id}`}
            className="flex gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="w-12 h-16 bg-zinc-200 dark:bg-zinc-700 rounded overflow-hidden flex-shrink-0">
              {book.cover && (
                <img src={book.cover} alt="" className="w-full h-full object-cover" />}
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                {book.title}
              </h4>
              <p className="text-xs text-zinc-500">{book.author}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
});

const TrendingSection = memo(function TrendingSection({ books, limit = 6 }) {
  if (!books || books.length === 0) return null;

  const trending = [...books]
    .filter((b) => b.rating >= 4)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);

  return (
    <section className="py-8">
      <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
        Les plus notés
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {trending.map((book) => (
          <BookRecommendationCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
});

const CategoryRecommendations = memo(function CategoryRecommendations({ category, excludeBookId, limit = 4 }) {
  const { getBooks } = useCatalog();
  const books = getBooks();

  const recommendations = useMemo(() => {
    return books
      .filter((b) => b.category === category && b.id !== excludeBookId)
      .slice(0, limit);
  }, [books, category, excludeBookId, limit]);

  if (recommendations.length === 0) return null;

  return (
    <section className="py-8">
      <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
        Dans la même catégorie
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((book) => (
          <BookRecommendationCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
});

export { RecommendationGrid, RecentlyViewedSection, TrendingSection, CategoryRecommendations };