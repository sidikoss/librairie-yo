import { Link, NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { APP_NAME } from "../../config/constants";

const navItems = [
  { to: "/", label: "Accueil" },
  { to: "/catalogue", label: "Catalogue" },
  { to: "/favoris", label: "Favoris" },
  { to: "/commandes", label: "Commandes" },
];

export default function Navbar() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-heading text-lg font-extrabold text-slate-900">
          {APP_NAME}
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm font-medium transition ${isActive ? "text-brand-700" : "text-slate-600 hover:text-slate-900"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            to="/panier"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            <span>Panier</span>
            {count > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[11px]">
                {count}
              </span>
            ) : null}
          </Link>
          <Link
            to="/admin"
            className="hidden rounded-full border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
          >
            Admin
          </Link>
        </div>
      </div>

      <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
