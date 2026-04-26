import { useState, useEffect, useMemo, createContext, useContext, useCallback } from "react";
import { firebaseApi } from "../services/firebaseApi";

const DealsContext = createContext(null);

const DEFAULT_DEALS = [
  {
    id: "flash1",
    type: "flash_sale",
    title: "Flash Sale - 20%",
    description: "Profitez de 20% de réduction sur tous les romans",
    discount: 20,
    discountType: "percent",
    category: "Roman",
    minPurchase: 0,
    maxDiscount: 10000,
    startsAt: Date.now(),
    endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    active: true,
  },
  {
    id: "newuser",
    type: "welcome",
    title: "Bienvenue - 10%",
    description: "10% de réduction pour votre première commande",
    discount: 10,
    discountType: "percent",
    minPurchase: 15000,
    maxDiscount: 5000,
    startsAt: Date.now(),
    endsAt: null,
    active: true,
  },
];

export function DealsProvider({ children }) {
  const [deals, setDeals] = useState(DEFAULT_DEALS);
  const [loading, setLoading] = useState(false);

  const activeDeals = useMemo(() => {
    const now = Date.now();
    return deals.filter((deal) => {
      if (!deal.active) return false;
      if (deal.startsAt && now < deal.startsAt) return false;
      if (deal.endsAt && now > deal.endsAt) return false;
      return true;
    });
  }, [deals]);

  const getDealById = useCallback(
    (dealId) => deals.find((d) => d.id === dealId),
    [deals]
  );

  const getDealsByCategory = useCallback(
    (category) => activeDeals.filter((d) => d.category === category),
    [activeDeals]
  );

  const calculateDiscount = useCallback(
    (amount, dealId = null) => {
      const applicableDeals = dealId
        ? activeDeals.filter((d) => d.id === dealId)
        : activeDeals;

      let bestDiscount = 0;
      let bestDeal = null;

      for (const deal of applicableDeals) {
        if (amount < deal.minPurchase) continue;

        let discount = 0;
        if (deal.discountType === "percent") {
          discount = (amount * deal.discount) / 100;
          if (deal.maxDiscount) {
            discount = Math.min(discount, deal.maxDiscount);
          }
        } else {
          discount = deal.discount;
        }

        if (discount > bestDiscount) {
          bestDiscount = discount;
          bestDeal = deal;
        }
      }

      return {
        discount: bestDiscount,
        deal: bestDeal,
        finalAmount: amount - bestDiscount,
      };
    },
    [activeDeals]
  );

  const value = {
    deals: activeDeals,
    loading,
    getDealById,
    getDealsByCategory,
    calculateDiscount,
  };

  return (
    <DealsContext.Provider value={value}>
      {children}
    </DealsContext.Provider>
  );
}

export function useDeals() {
  const context = useContext(DealsContext);
  if (!context) {
    throw new Error("useDeals must be used within DealsProvider");
  }
  return context;
}