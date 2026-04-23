import { Link } from "react-router-dom";
import { APP_NAME, OM_NUMBER, WA_NUMBER } from "../../config/constants";
import { buildWhatsAppUrl } from "../../features/whatsapp/whatsapp";

function formatPhone(num) {
  const cleaned = String(num || "").replace(/^224/, "");
  return `+224 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`.trim();
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-white/70 bg-white/80 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-brand-600" />
            <span className="h-3 w-3 rounded-full bg-accent-500" />
            <span className="h-3 w-3 rounded-full bg-guinea-600" />
            <span className="pl-1 font-heading text-base font-extrabold text-slate-900">
              {APP_NAME}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Librairie digitale en Guinée. Achat simple, livraison rapide.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Navigation
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li><Link to="/catalogue" className="hover:text-brand-700">Catalogue</Link></li>
            <li><Link to="/favoris" className="hover:text-brand-700">Favoris</Link></li>
            <li><Link to="/panier" className="hover:text-brand-700">Panier</Link></li>
            <li><Link to="/commandes" className="hover:text-brand-700">Mes commandes</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Contact
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>
              <a
                href={buildWhatsAppUrl("Bonjour Librairie YO !")}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-700"
              >
                WhatsApp · {formatPhone(WA_NUMBER)}
              </a>
            </li>
            <li>Orange Money · {formatPhone(OM_NUMBER)}</li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Paiement & Livraison
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Paiement Orange Money</li>
            <li>Livraison rapide en Guinée</li>
            <li>Suivi de commande</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200/70">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-slate-500">
          © {year} {APP_NAME}. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
