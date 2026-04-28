import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BookGrid from "../components/books/BookGrid";
import CustomerTrustSection from "../components/home/CustomerTrustSection";
import HeroSection from "../components/home/HeroSection";
import SectionHeader from "../components/ui/SectionHeader";
import BookSkeleton from "../components/ui/BookSkeleton";
import SEO from "../components/seo/SEO";
import { useCart } from "../context/CartContext";
import { useCatalog } from "../context/CatalogContext";
import StarRating from "../components/ui/RatingStars";
import { ChevronRight } from "lucide-react";

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
    categories,
  } = useCatalog();

  const heroBooks = useMemo(() => popularBooks.slice(0, 4), [popularBooks]);

  return (
    <div className="space-y-10">
      <SEO 
        title="Accueil" 
        description="Achetez vos livres rapidement en Guinée avec paiement Orange Money et livraison. Catalogue mobile et complet." 
      />
      
      {/* Promo Banner */}
      <div className="bg-red-100 border-l-4 border-red-500 p-4 text-center rounded-r-lg shadow-sm">
        <p className="font-bold text-red-700">
          🔥 Promotion : -20% sur les livres scolaires ! Code: <span className="bg-red-500 text-white px-2 py-0.5 rounded">ECOLE20</span>
        </p>
      </div>
      
      <HeroSection />

      {error ? (
        <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-600 rounded-lg">
          <span className="mr-2 font-bold">⚠️</span>
          {error}
        </div>
      ) : null}

      <CustomerTrustSection totalSoldBooks={totalSoldBooks} />

      {/* Categories Section */}
      {categories && categories.length > 0 && (
        <section>
          <SectionHeader
            eyebrow="Catégories"
            title="Explorez par catégorie"
            description="Trouvez facilement vos livres par catégorie"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat.id || cat.name}
                onClick={() => navigate(`/categorie/${cat.name}`)}
                className="p-4 bg-white border rounded-xl hover:border-green-500 hover:shadow-md transition text-left"
              >
                <span className="text-2xl mb-2 block">{cat.emoji || "📚"}</span>
                <p className="font-semibold text-sm text-gray-800">{cat.name}</p>
                <p className="text-xs text-gray-500 mt-1">{cat.count || ""} livres</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Popular books - Top Sales */}
      <section>
        <SectionHeader
          eyebrow="Top ventes"
          title="Livres populaires en ce moment"
          description="Sélection basée sur les commandes validées."
        />
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <BookSkeleton key={i} />)}
          </div>
        ) : (
          <BookGrid
            books={popularBooks}
            onAddToCart={addItem}
            onToggleFavorite={toggleWishlist}
            isFavorite={isFavorite}
            emptyMessage="Aucun livre populaire pour le moment."
          />
        )}
      </section>

      {/* New books */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <SectionHeader
            eyebrow="Nouveautés"
            title="Dernières sorties"
            description="Nouveaux titres disponibles, prêts pour achat rapide via WhatsApp."
          />
          <button
            onClick={() => navigate("/catalogue")}
            className="hidden md:flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-semibold"
          >
            Voir tout
            <ChevronRight size={16} />
          </button>
        </div>
        <BookGrid
          books={newBooks}
          onAddToCart={addItem}
          onToggleFavorite={toggleWishlist}
          isFavorite={isFavorite}
          emptyMessage="Les nouveautés arrivent bientôt."
        />
      </section>

      {/* Customer Reviews Section */}
      <section className="bg-gray-50 rounded-2xl p-6 md:p-8">
        <SectionHeader
          eyebrow="Témoignages"
          title="Avis clients"
          description="Ce que disent nos clients satisfaits"
        />
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          {[
            { name: "Aminata K.", rating: 5, comment: "Très bon service ! Livraison rapide et livres de qualité." },
            { name: "Moussa D.", rating: 5, comment: "Paiement Orange Money super simple. Je recommande !" },
            { name: "Fatou S.", rating: 4, comment: "Bon choix de livres. Le panier est très pratique." }
          ].map((review, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border">
              <div className="flex items-center gap-2 mb-2">
                <StarRating rating={review.rating} />
              </div>
              <p className="text-gray-600 text-sm mb-2">"{review.comment}"</p>
              <p className="font-semibold text-sm text-gray-800">{review.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gray-900 p-8 text-center shadow-2xl">
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-green-500/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-green-500/10 blur-3xl" />
        </div>

        <div className="relative">
          <h3 className="font-bold text-2xl text-white mb-3">
            Prêt à commander ?
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-300">
            Explorez tout le catalogue et finalisez rapidement votre achat sur WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate("/catalogue")}
              className="group rounded-2xl bg-green-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-green-700"
            >
              <span className="flex items-center gap-2">
                Voir tout le catalogue
                <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </button>
            <div className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-4 py-2 text-xs font-semibold text-gray-300">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              {books.length} livres disponibles
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
