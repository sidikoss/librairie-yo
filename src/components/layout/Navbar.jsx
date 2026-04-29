import { useState, useEffect, useCallback, memo } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { APP_NAME } from "../../config/constants";

const navItems = [
  { to: "/", label: "Accueil", icon: "🏠" },
  { to: "/catalogue", label: "Catalogue", icon: "📚" },
  { to: "/favoris", label: "Favoris", icon: "♥" },
  { to: "/commandes", label: "Commandes", icon: "📦" },
];

function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      if (!localStorage.getItem("theme")) {
        setIsDark(e.matches);
        document.documentElement.classList.toggle("dark", e.matches);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  }, [isDark]);

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-full border p-1.5 text-sm transition-all duration-300 hover:scale-110"
      style={{
        backgroundColor: isDark ? '#27272a' : '#fafafa',
        borderColor: isDark ? '#3f3f46' : '#e4e4e7',
        color: isDark ? '#fafafa' : '#18181b'
      }}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      aria-pressed={isDark}
    >
      {isDark ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export default function Navbar({ onCartClick }) {
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ease-out-expo`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderBottom: '1px solid rgba(228, 228, 231, 0.3)'
      }}
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
          <span className="pl-0.5 font-heading text-lg font-extrabold tracking-tight text-zinc-900 transition-colors duration-300 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
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
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          {isInstallable && (
            <button
              onClick={installPWA}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-700 shadow-sm transition-all duration-300 hover:bg-brand-100 hover:shadow-md animate-fade-in dark:border-brand-700 dark:bg-brand-900/60 dark:text-brand-300 dark:hover:bg-brand-900"
              aria-label="Installer l'application"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Installer App
            </button>
          )}
          <button
             onClick={onCartClick}
             className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-guinea-500 to-guinea-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-guinea-300/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-guinea-300/40"
             aria-label={count > 0 ? `Panier avec ${count} article${count > 1 ? "s" : ""}` : "Panier vide"}
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
             </svg>
             <span>Panier</span>
             {count > 0 && (
               <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-400 px-1 text-[11px] font-extrabold text-zinc-900 animate-bounce-in">
                 {count}
               </span>
             )}
           </button>
          <Link
            to="/admin"
            className="hidden rounded-xl border border-zinc-200/80 bg-white/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-600 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 hover:shadow-md sm:inline-flex dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-brand-600 dark:hover:bg-brand-900/50 dark:hover:text-brand-400"
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
                  : "bg-white/80 text-zinc-600 shadow-sm ring-1 ring-zinc-200/60 backdrop-blur-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-700"
              }`
            }
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        {isInstallable && (
          <button
            onClick={installPWA}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-700 shadow-sm ring-1 ring-brand-200 transition-all duration-300 hover:bg-brand-100 animate-fade-in dark:bg-brand-900/50 dark:text-brand-300 dark:ring-brand-800"
          >
            <span aria-hidden="true">⬇️</span>
            Installer App
          </button>
        )}
      </nav>
    </header>
  );
}
