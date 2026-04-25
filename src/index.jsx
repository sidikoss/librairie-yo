/**
 * Librairie YO - Main Entry Point
 * @module src/index
 * @description Point d'entrée principal de l'application
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

import App from "./App";

import { CatalogProvider } from "./context/CatalogContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./components/ui/Toast";
import { DarkModeProvider } from "./hooks/useDarkMode";
import { WishlistProvider } from "./context/WishlistContext";
import { DealsProvider } from "./context/DealsContext";
import { ReviewsProvider } from "./context/ReviewsContext";
import { LoyaltyProvider } from "./context/LoyaltyContext";
import { PriceAlertProvider } from "./context/PriceAlertContext";
import { OrdersProvider } from "./context/OrdersContext";
import { TrackingProvider } from "./context/TrackingContext";
import { FlashSaleProvider } from "./context/FlashSaleContext";
import { BundlesProvider } from "./context/BundlesContext";
import { RecommendationsProvider } from "./context/RecommendationsContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { AnalyticsProvider } from "./context/AnalyticsContext";

import "./index.css";

function Providers({ children }) {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <DarkModeProvider>
          <ToastProvider>
            <CatalogProvider>
              <CartProvider>
                <WishlistProvider>
                  <DealsProvider>
                    <ReviewsProvider>
                      <LoyaltyProvider>
                        <PriceAlertProvider>
                          <OrdersProvider>
                            <TrackingProvider>
                              <FlashSaleProvider>
                                <BundlesProvider>
                                  <RecommendationsProvider>
                                    <NotificationsProvider>
                                      <AnalyticsProvider>
                                        {children}
                                      </AnalyticsProvider>
                                    </NotificationsProvider>
                                  </RecommendationsProvider>
                                </BundlesProvider>
                              </FlashSaleProvider>
                            </TrackingProvider>
                          </OrdersProvider>
                        </PriceAlertProvider>
                      </LoyaltyProvider>
                    </ReviewsProvider>
                  </DealsProvider>
                </WishlistProvider>
              </CartProvider>
            </CatalogProvider>
          </ToastProvider>
        </DarkModeProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <Providers>
        <App />
      </Providers>
    </StrictMode>
  );
}