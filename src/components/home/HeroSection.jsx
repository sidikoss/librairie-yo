import { Link } from "react-router-dom";
import { useCatalog } from "../../context/CatalogContext";
import { WA_NUMBER } from "../../config/constants";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  const { books, totalSoldBooks } = useCatalog();
  const waUrl = WA_NUMBER ? `https://wa.me/${WA_NUMBER.replace(/^0/, '224')}` : null;

  return (
    <section className="text-center py-16 bg-gray-100">
      {/* Badge top sales */}
      {totalSoldBooks > 0 && (
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
          <span>🔥</span>
          <span>{totalSoldBooks}+ livres vendus</span>
        </div>
      )}

      {/* Main Title */}
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
        Achetez vos livres en Guinée 📚
      </h1>

      {/* Description */}
      <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
        Livraison rapide à Conakry et partout en Guinée
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <Link
          to="/catalogue"
          className="group inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl text-lg font-semibold hover:bg-green-700 transition-all hover:-translate-y-0.5"
        >
          Voir les livres
          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </Link>

        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-xl text-lg font-semibold border-2 border-green-600 hover:bg-green-50 transition-all hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M19.05 4.94A9.94 9.94 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.51 1.34 5.04L2 22l5.1-1.33A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.95-7.06Z"/>
            </svg>
            Commander sur WhatsApp
          </a>
        )}
      </div>

      {/* Trust indicators */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Paiement Orange Money</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Livraison rapide</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Support WhatsApp</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 flex justify-center gap-8">
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{books.length || "100+"}</p>
          <p className="text-sm text-gray-600">Livres disponibles</p>
        </div>
        {totalSoldBooks > 0 && (
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{totalSoldBooks}+</p>
            <p className="text-sm text-gray-600">Ventes</p>
          </div>
        )}
      </div>
    </section>
  );
}
