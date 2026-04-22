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
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="group inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-brand-600 shadow-sm shadow-brand-300" />
          <span className="h-3 w-3 rounded-full bg-accent-500 shadow-sm shadow-accent-200" />
          <span className="h-3 w-3 rounded-full bg-guinea-600 shadow-sm shadow-guinea-200" />
          <span className="pl-1 font-heading text-lg font-extrabold tracking-tight text-slate-900 transition group-hover:text-brand-700">
            {APP_NAME}
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand-600 text-white shadow-md shadow-brand-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            to="/panier"
            className="inline-flex items-center gap-2 rounded-full bg-guinea-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-guinea-200 transition hover:bg-guinea-700"
          >
            <span>Panier</span>
            {count > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] text-slate-900">
                {count}
              </span>
            ) : null}
          </Link>
          <Link
            to="/admin"
            className="hidden rounded-full border border-brand-200 bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 sm:inline-flex"
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
              `whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
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
