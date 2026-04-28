import { memo, useState } from "react";
import { Link } from "react-router-dom";
import LazyImage from "../ui/LazyImage";
import { ShoppingCart, Heart } from "lucide-react";

const BookCard = memo(function BookCard({
  book,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
}) {
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    onAddToCart(book);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <article className="border rounded-xl p-4 hover:shadow-lg transition-all duration-300 flex flex-col h-full bg-white">
      {/* Cover image */}
      <Link to={`/livre/${book.id}`} className="block aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 mb-3">
        {book.image ? (
          <LazyImage
            src={book.image}
            alt={`Couverture du livre "${book.title}"`}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loadingStrategy="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">
            {book.emoji || "📖"}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {book.isPopular && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              🔥 Top vente
            </span>
          )}
          {book.stockLimited && (
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
              ⏳ Stock limité
            </span>
          )}
          {book.fastDelivery && (
            <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
              🚀 Livraison rapide
            </span>
          )}
        </div>
      </Link>

      {/* Card body */}
      <div className="flex-1 flex flex-col">
        <Link to={`/livre/${book.id}`} className="block">
          <h3 className="font-semibold text-gray-900 mb-1 hover:text-green-600 transition">
            {book.title}
          </h3>
          <p className="text-sm text-gray-500 mb-2">{book.author}</p>
        </Link>

        <div className="mt-auto">
          <p className="text-green-600 font-bold text-lg mb-3">
            {book.price?.toLocaleString()} GNF
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isAdded}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition ${
                isAdded
                  ? "bg-green-500 text-white"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <ShoppingCart size={16} />
              {isAdded ? "Ajouté!" : "Ajouter au panier"}
            </button>

            <button
              onClick={(e) => { e.preventDefault(); onToggleFavorite(book.id); }}
              className={`p-2 rounded-lg border transition ${
                isFavorite
                  ? "bg-red-50 border-red-300 text-red-500"
                  : "border-gray-300 text-gray-400 hover:border-gray-400"
              }`}
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
});

export default BookCard;
