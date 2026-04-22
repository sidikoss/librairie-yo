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

function PageLoader() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <div className="rounded-xl bg-white px-5 py-3 text-sm text-slate-500 shadow-sm">
        Chargement...
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/catalogue" element={<CatalogPage />} />
          <Route path="/panier" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/favoris" element={<FavoritesPage />} />
          <Route path="/commandes" element={<OrdersPage />} />
          <Route path="/lecture" element={<SecureReaderPage />} />
          <Route path="/orders" element={<Navigate to="/commandes" replace />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
