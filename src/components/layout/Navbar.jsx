import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { APP_NAME } from "../../config/constants";

const navItems = [
  { to: "/", label: "Accueil", icon: "🏠" },
  { to: "/catalogue", label: "Catalogue", icon: "📚" },
  { to: "/favoris", label: "Favoris", icon: "♥" },
  { to: "/commandes", label: "Commandes", icon: "📦" },
];

export default function Navbar() {
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ease-out-expo ${
        scrolled
          ? "border-b border-slate-200/60 bg-white/92 shadow-sm backdrop-blur-xl"
          : "border-b border-white/40 bg-white/70 backdrop-blur-lg"
      }`}
      role="banner"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo with Guinea flag colors */}
        <Link to="/" className="group inline-flex items-center gap-2.5" aria-label="Accueil - Librairie YO">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-brand-500 shadow-sm shadow-brand-300/50 transition-transform duration-300 group-hover:scale-125" aria-hidden="true" />
            <span className="h-3 w-3 rounded-full bg-accent-500 shadow-sm shadow-accent-300/50 transition-transform delay-75 duration-300 group-hover:scale-125" aria-hidden="true" />
            <span className="h-3 w-3 rounded-full bg-guinea-500 shadow-sm shadow-guinea-300/50 transition-transform delay-150 duration-300 group-hover:scale-125" aria-hidden="true" />
          </div>
          <span className="pl-0.5 font-heading text-lg font-extrabold tracking-tight text-slate-900 transition-colors duration-300 group-hover:text-brand-600">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200/50"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/panier"
            className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-guinea-500 to-guinea-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-guinea-300/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-guinea-300/40"
            aria-label={count > 0 ? `Panier avec ${count} article${count > 1 ? "s" : ""}` : "Panier vide"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span>Panier</span>
            {count > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-400 px-1 text-[11px] font-extrabold text-slate-900 animate-bounce-in">
                {count}
              </span>
            )}
          </Link>
          <Link
            to="/admin"
            className="hidden rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 hover:shadow-md sm:inline-flex"
            aria-label="Accès administration"
          >
            Admin
          </Link>
        </div>
      </div>

      {/* Mobile navigation */}
      <nav className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-3 md:hidden" aria-label="Navigation mobile">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-200/40"
                  : "bg-white/80 text-slate-600 shadow-sm ring-1 ring-slate-200/60 backdrop-blur-sm hover:bg-slate-50"
              }`
            }
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
