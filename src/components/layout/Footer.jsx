import { Link } from "react-router-dom";
import { APP_NAME, WA_NUMBER, OM_NUMBER } from "../../config/constants";
import { MessageCircle } from "lucide-react";

function formatPhone(num) {
  const cleaned = String(num || "").replace(/^224/, "");
  return `+224 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`.trim();
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-black text-white p-6 text-center">
      {/* Navigation Links */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          {[
            { to: "/catalogue", label: "Catalogue" },
            { to: "/favoris", label: "Favoris" },
            { to: "/panier", label: "Panier" },
            { to: "/commandes", label: "Mes commandes" },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm text-gray-300 hover:text-white transition"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap justify-center gap-6 mb-6">
          {WA_NUMBER && (
            <a
              href={`https://wa.me/${WA_NUMBER.replace(/^0/, '224')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-green-400 transition"
            >
              <MessageCircle size={16} />
              {formatPhone(WA_NUMBER)}
            </a>
          )}
          {OM_NUMBER && (
            <div className="inline-flex items-center gap-2 text-sm text-gray-300">
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                OM
              </span>
              {formatPhone(OM_NUMBER)}
            </div>
          )}
        </div>

        {/* Payment & Delivery */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <span>💳 Paiement Orange Money</span>
          <span>🚀 Livraison rapide</span>
          <span>📱 Suivi de commande</span>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-gray-800 pt-4">
        <p className="text-sm text-gray-400">
          © {year} {APP_NAME}. Tous droits réservés.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Contact : WhatsApp / Email
        </p>
        <p className="text-xs text-gray-600 mt-2">
          🇬🇳 Fait avec ♥ en Guinée
        </p>
      </div>
    </footer>
  );
}
