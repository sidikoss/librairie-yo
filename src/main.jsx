import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./context/CartContext";
import { CatalogProvider } from "./context/CatalogContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CatalogProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </CatalogProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
