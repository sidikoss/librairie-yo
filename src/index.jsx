import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import App from "./App";
import { CatalogProvider } from "./context/CatalogContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./components/ui/Toast";
import "./index.css";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <HelmetProvider>
        <BrowserRouter>
          <CatalogProvider>
            <CartProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </CartProvider>
          </CatalogProvider>
        </BrowserRouter>
      </HelmetProvider>
    </StrictMode>
  );
}

