import { Link } from "react-router-dom";
import { APP_NAME, OM_NUMBER, WA_NUMBER } from "../../config/constants";
import { buildWhatsAppUrl } from "../../features/whatsapp/whatsapp";
import { usePwaInstall } from "../../hooks/usePwaInstall";

function formatPhone(num) {
  const cleaned = String(num || "").replace(/^224/, "");
  return `+224 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`.trim();
}

export default function Footer() {
  const year = new Date().getFullYear();
  const { isInstallable, installPWA } = usePwaInstall();
  return (
    <footer className="relative mt-16 overflow-hidden border-t border-zinc-200/50 dark:border-zinc-800/50">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-zinc-50/50 to-zinc-100/80 dark:from-zinc-900/80 dark:via-zinc-800/50 dark:to-zinc-800/80 backdrop-blur-sm" />

      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-brand-500" aria-hidden="true" />
              <span className="h-3 w-3 rounded-full bg-accent-500" aria-hidden="true" />
              <span className="h-3 w-3 rounded-full bg-guinea-500" aria-hidden="true" />
            </div>
            <span className="pl-0.5 font-heading text-base font-extrabold text-zinc-900 dark:text-white">
              {APP_NAME}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            Librairie digitale en Guinée. Achat simple, paiement sécurisé, livraison rapide.
          </p>
          <div className="mt-4 flex items-center gap-1">
            <div className="h-0.5 w-8 rounded-full bg-brand-400" />
            <div className="h-0.5 w-4 rounded-full bg-accent-400" />
            <div className="h-0.5 w-2 rounded-full bg-guinea-400" />
          </div>
        </div>

        {/* Navigation */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
            Navigation
          </p>
          <ul className="mt-4 space-y-2.5">
            {[
              { to: "/catalogue", label: "Catalogue" },
              { to: "/favoris", label: "Favoris" },
              { to: "/panier", label: "Panier" },
              { to: "/commandes", label: "Mes commandes" },
            ].map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="link-animated text-sm text-zinc-600 transition-colors duration-300 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
            Contact
          </p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a
                href={buildWhatsAppUrl("Bonjour Librairie YO !")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-zinc-600 transition-colors duration-300 hover:text-guinea-600 dark:text-zinc-400 dark:hover:text-guinea-400"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-guinea-500" aria-hidden="true">
                  <path d="M19.05 4.94A9.94 9.94 0 0 0 12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.51 1.34 5.04L2 22l5.1-1.33A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10 0-2.67-1.04-5.18-2.95-7.06ZM12 20.1c-1.52 0-3-.4-4.31-1.16l-.31-.18-3.03.79.81-2.95-.2-.31A8.03 8.03 0 0 1 4 12a8 8 0 1 1 8 8.1Z"/>
                </svg>
                {formatPhone(WA_NUMBER)}
              </a>
            </li>
            <li className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white" aria-hidden="true">
                OM
              </span>
              {formatPhone(OM_NUMBER)}
            </li>
          </ul>
        </div>

        {/* Payment & Delivery */}
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">
            Paiement & Livraison
          </p>
          <ul className="mt-4 space-y-2.5">
            {[
              { icon: "💳", text: "Paiement Orange Money" },
              { icon: "🚀", text: "Livraison rapide en Guinée" },
              { icon: "📱", text: "Suivi de commande" },
            ].map((item) => (
              <li key={item.text} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span aria-hidden="true">{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

{/* App Install Button */}
      {isInstallable && (
        <div className="relative border-t border-zinc-200/50 bg-brand-50/50 dark:border-zinc-800/50 dark:bg-brand-900/20">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 px-4 py-6 text-center sm:flex-row">
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Profitez d'une meilleure expérience sur votre mobile
            </p>
            <button
              onClick={installPWA}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-200/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-300/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Installer l'Application
            </button>
          </div>
        </div>
      )}

      {/* Copyright bar */}
      <div className="relative border-t border-zinc-200/50 dark:border-zinc-800/50">
        <p className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-zinc-400">
          © {year} {APP_NAME}. Tous droits réservés. 🇬🇳 Fait avec ♥ en Guinée
        </p>
      </div>
    </footer>
  );
}
