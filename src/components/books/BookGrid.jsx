import { memo } from "react";
import { Link } from "react-router-dom";
import BookCard from "./BookCard";

const BookGrid = memo(function BookGrid({
  books,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
  emptyMessage = "Aucun livre trouvé avec ces filtres.",
}) {
  if (!books.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white/60 p-10 text-center backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-800/60">
        <span className="mb-3 block text-4xl" aria-hidden="true">📚</span>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {books.map((book, index) => (
        <Link
          key={book.id}
          to={`/livre/${book.id}`}
          className="block opacity-0-initial animate-fade-in-up fill-forwards"
          style={{ animationDelay: `${Math.min(index * 80, 600)}ms` }}
        >
          <BookCard
            book={book}
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite(book.id)}
          />
        </Link>
      ))}
    </div>
  );
});

export default BookGrid;
