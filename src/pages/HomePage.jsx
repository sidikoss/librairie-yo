import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BookGrid from "../components/books/BookGrid";
import { BookGridSkeleton } from "../components/books/BookSkeleton";
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
          description="Selection basee sur les commandes validees."
        />
        {loading ? (
          <BookGridSkeleton count={4} />
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

      <section className="relative overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-brand-600 via-brand-500 to-guinea-600 p-8 text-center shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" aria-hidden="true" />
        <div className="relative">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-medium text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Commande rapide
          </span>
          <h3 className="font-heading text-2xl font-extrabold text-white sm:text-3xl">
            Pret a commander ?
          </h3>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/85">
            Explorez notre catalogue complet et finalisez rapidement votre achat via WhatsApp ou Orange Money.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => navigate("/catalogue")}
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-brand-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Explorer le catalogue
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
            <a
              href="https://wa.me/224622000000"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/50 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-white hover:bg-white/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contacter sur WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="text-center text-xs text-slate-500">
        {books.length} livres disponibles
      </section>
    </div>
  );
}
