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
    <div className="space-y-10">
      <SEO 
        title="Accueil" 
        description="Achetez vos livres rapidement en Guinée avec paiement Orange Money, PayCard et livraison. Catalogue mobile et complet." 
      />
      <HeroSection />

      {error ? (
        <div className="card-surface border-brand-200 bg-brand-50/50 p-4 text-sm text-brand-600">
          <span className="mr-2 font-bold">⚠️</span>
          {error}
        </div>
      ) : null}

      <CustomerTrustSection totalSoldBooks={totalSoldBooks} />

      {/* Popular books */}
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
            books={heroBooks}
            onAddToCart={addItem}
            onToggleFavorite={toggleWishlist}
            isFavorite={isFavorite}
            emptyMessage="Aucun livre populaire pour le moment."
          />
        )}
      </section>

      {/* New books */}
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

      {/* CTA Section */}
      <section className="relative overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-center shadow-2xl sm:p-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-guinea-500/10 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/10 blur-3xl" />
        </div>

        <div className="relative">
          <h3 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
            Prêt à commander ?
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
            Explorez tout le catalogue et finalisez rapidement votre achat sur WhatsApp.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate("/catalogue")}
              className="group rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-500/30"
            >
              <span className="flex items-center gap-2">
                Voir tout le catalogue
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-guinea-400 animate-pulse-soft" />
              {books.length} livres disponibles
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
