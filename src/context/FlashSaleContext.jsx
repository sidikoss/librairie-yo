import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const FlashSaleContext = createContext(null);

const DEFAULT_FLASH_SALES = [
  {
    id: "flash-weekend",
    title: "Flash Weekend",
    description: "-20% sur tous les romans ce weekend!",
    discount: 20,
    discountType: "percent",
    category: null,
    products: [],
    startsAt: Date.now() - 60 * 60 * 1000,
    endsAt: Date.now() + 48 * 60 * 60 * 1000,
    active: true,
    banner: true,
    badge: true,
  },
  {
    id: "flash-new",
    title: "Nouveautés -15%",
    description: "-15% sur les 10 derniers ajouts",
    discount: 15,
    discountType: "percent",
    category: null,
    isNewArrival: true,
    startsAt: Date.now(),
    endsAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    active: true,
    banner: false,
    badge: true,
  },
];

export function FlashSaleProvider({ children }) {
  const [flashSales, setFlashSales] = useState(DEFAULT_FLASH_SALES);

  const activeFlashSales = useMemo(() => {
    const now = Date.now();
    return flashSales.filter((sale) => {
      if (!sale.active) return false;
      if (now < sale.startsAt) return false;
      if (now > sale.endsAt) return false;
      return true;
    });
  }, [flashSales]);

  const currentFlashSale = useMemo(() => {
    return activeFlashSales.find((sale) => sale.banner) || activeFlashSales[0] || null;
  }, [activeFlashSales]);

  const getTimeRemaining = useCallback((endsAt) => {
    const now = Date.now();
    const diff = endsAt - now;

    if (diff <= 0) return { expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, expired: false };
  }, []);

  const value = {
    flashSales: activeFlashSales,
    currentFlashSale,
    getTimeRemaining,
  };

  return (
    <FlashSaleContext.Provider value={value}>
      {children}
    </FlashSaleContext.Provider>
  );
}

export function useFlashSale() {
  const context = useContext(FlashSaleContext);
  if (!context) {
    throw new Error("useFlashSale must be used within FlashSaleProvider");
  }
  return context;
}