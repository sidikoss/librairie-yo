import BookCard from "./BookCard";

export default function BookGrid({
  books,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
  emptyMessage = "Aucun livre trouvé avec ces filtres.",
}) {
  if (!books.length) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 p-10 text-center backdrop-blur-sm">
        <span className="mb-3 block text-4xl" aria-hidden="true">📚</span>
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {books.map((book, index) => (
        <div
          key={book.id}
          className="opacity-0-initial animate-fade-in-up fill-forwards"
          style={{ animationDelay: `${Math.min(index * 80, 600)}ms` }}
        >
          <BookCard
            book={book}
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite(book.id)}
          />
        </div>
      ))}
    </div>
  );
}
