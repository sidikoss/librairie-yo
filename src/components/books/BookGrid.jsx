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
      <div className="rounded-2xl border border-dashed border-brand-200 bg-white/90 p-8 text-center text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
          isFavorite={isFavorite(book.id)}
        />
      ))}
    </div>
  );
}
