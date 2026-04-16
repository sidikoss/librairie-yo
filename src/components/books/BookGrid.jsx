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
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
