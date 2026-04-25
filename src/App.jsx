/**
 * Librairie YO - Main App Component
 * @module src/App
 * @description Composant principal avec routing
 */

import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import RootLayout from "./components/layout/RootLayout";

const HomePage = lazy(() => import("./pages/HomePage"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const SecureReaderPage = lazy(() => import("./pages/SecureReaderPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const routes = [
  { path: "/", component: HomePage, name: "home" },
  { path: "/catalogue", component: CatalogPage, name: "catalogue" },
  { path: "/panier", component: CartPage, name: "cart" },
  { path: "/checkout", component: CheckoutPage, name: "checkout" },
  { path: "/favoris", component: FavoritesPage, name: "favorites" },
  { path: "/commandes", component: OrdersPage, name: "orders" },
  { path: "/lecture", component: SecureReaderPage, name: "reader" },
  { path: "/admin", component: AdminPage, name: "admin" },
];

/**
 * Page loading fallback component
 * @returns {JSX.Element}
 */
function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-500" />
        <p className="text-sm text-zinc-500">Chargement...</p>
      </div>
    </div>
  );
}

/**
 * Main App component with route configuration
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<RootLayout />}>
          {routes.map(({ path, component: Component }) => (
            <Route
              key={path}
              path={path}
              element={<Component />}
            />
          ))}
          <Route
            path="/orders"
            element={<Navigate to="/commandes" replace />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}