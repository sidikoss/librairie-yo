import { useState, useEffect, useCallback, memo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { APP_NAME } from "../../config/constants";
import { Search, ShoppingCart, User } from "lucide-react";

const navItems = [
  { to: "/", label: "Accueil", icon: "🏠" },
  { to: "/catalogue", label: "Catalogue", icon: "📚" },
  { to: "/favoris", label: "Favoris", icon: "♥" },
  { to: "/commandes", label: "Commandes", icon: "📦" },
];

export default function Navbar({ onCartClick }) {
  const { count } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const { isInstallable, installPWA } = usePWAInstall();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalogue?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-500 ${
        scrolled ? "shadow-md bg-white" : "bg-white"
      }`}
      role="banner"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="group inline-flex items-center gap-2" aria-label="Accueil - Librairie YO">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-green-600 shadow-sm" />
            <span className="h-3 w-3 rounded-full bg-green-400 shadow-sm" />
            <span className="h-3 w-3 rounded-full bg-green-500 shadow-sm" />
          </div>
          <span className="pl-0.5 font-bold text-xl text-green-600">
            {APP_NAME}
          </span>
        </Link>

        {/* Search Bar - Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un livre..."
            className="w-full border border-gray-300 rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500"
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-r-lg hover:bg-green-700 transition"
          >
            <Search size={18} />
          </button>
        </form>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/connexion"
            className="hidden md:flex items-center gap-1 text-gray-600 hover:text-green-600 transition"
          >
            <User size={20} />
            <span className="text-sm">Connexion</span>
          </Link>

          <button
            onClick={onCartClick}
            className="relative inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            aria-label={count > 0 ? `Panier avec ${count} article${count > 1 ? "s" : ""}` : "Panier vide"}
          >
            <ShoppingCart size={18} />
            <span className="text-sm font-semibold">Panier</span>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                {count}
              </span>
            )}
          </button>

          <Link
            to="/admin"
            className="hidden md:inline-flex text-sm text-gray-500 hover:text-green-600 transition"
          >
            Admin
          </Link>
        </div>
      </div>

      {/* Mobile Search */}
      <form onSubmit={handleSearch} className="md:hidden px-4 pb-3">
        <div className="flex">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un livre..."
            className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500"
          />
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded-r-lg hover:bg-green-700 transition"
          >
            <Search size={18} />
          </button>
        </div>
      </form>

      {/* Navigation - Mobile */}
      <nav className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-3 md:hidden" aria-label="Navigation mobile">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-300 ${
                isActive
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
