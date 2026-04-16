import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BookGrid from "../components/books/BookGrid";
import CustomerTrustSection from "../components/home/CustomerTrustSection";
import HeroSection from "../components/home/HeroSection";
import SectionHeader from "../components/ui/SectionHeader";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const {
    loading,
    error,
    books,
    popularBooks,
    newBooks,
    toggleWishlist,
    isFavorite,
    totalSoldBooks,
  } = useCatalog();

  const heroBooks = useMemo(() => popularBooks.slice(0, 4), [popularBooks]);

  return (
    <div className="space-y-8">
      <HeroSection />

      {error ? (
        <div className="card-surface p-4 text-sm text-rose-600">{error}</div>
      ) : null}

      <CustomerTrustSection totalSoldBooks={totalSoldBooks} />

      <section>
        <SectionHeader
          eyebrow="Top ventes"
          title="Livres populaires en ce moment"
          description="Sélection basée sur les commandes validées."
        />
        {loading ? (
          <div className="card-surface p-6 text-center text-sm text-slate-500">
            Chargement du catalogue...
          </div>
        ) : (
          <BookGrid
            books={heroBooks}
            onAddToCart={addItem}
            onToggleFavorite={toggleWishlist}
            isFavorite={isFavorite}
            emptyMessage="Aucun livre populaire pour le moment."
          />
        )}
      </section>

      <section>
        <SectionHeader
          eyebrow="Nouveautés"
          title="Dernières sorties"
          description="Nouveaux titres disponibles, prêts pour achat rapide via WhatsApp."
        />
        <BookGrid
          books={newBooks}
          onAddToCart={addItem}
          onToggleFavorite={toggleWishlist}
          isFavorite={isFavorite}
          emptyMessage="Les nouveautés arrivent bientôt."
        />
      </section>

      <section className="card-surface p-5 text-center">
        <h3 className="font-heading text-xl font-extrabold text-slate-900">
          Prêt à commander ?
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Explorez tout le catalogue et finalisez rapidement votre achat sur WhatsApp.
        </p>
        <button
          onClick={() => navigate("/catalogue")}
          className="mt-4 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Voir tout le catalogue
        </button>
      </section>

      <section className="text-center text-xs text-slate-500">
        {books.length} livres disponibles
      </section>
    </div>
  );
}
