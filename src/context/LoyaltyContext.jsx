import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "../config/constants";

const LoyaltyContext = createContext(null);

const LOYALTY_TIERS = [
  {
    id: "bronze",
    name: "Bronze",
    minPoints: 0,
    discount: 0,
    benefits: ["Accumulation des points", "Notifications exclusives"],
  },
  {
    id: "silver",
    name: "Argent",
    minPoints: 500,
    discount: 3,
    benefits: ["3% de réduction", "Livraison gratuite", "Accès anticipé aux soldes"],
  },
  {
    id: "gold",
    name: "Or",
    minPoints: 1500,
    discount: 5,
    benefits: ["5% de réduction", "Livraison gratuite", "Accès anticipé aux soldes", "Cadeaux exclusif"],
  },
  {
    id: "platinum",
    name: "Platine",
    minPoints: 3000,
    discount: 8,
    benefits: ["8% de réduction", "Livraison gratuite", "Accès anticipé aux soldes", "Cadeaux exclusif", "Service prioritaire"],
  },
];

const POINTS_CONFIG = {
  perAmount: 100,
  pointsEarned: 1,
  signupBonus: 50,
  referralBonus: 200,
  reviewBonus: 25,
  birthdayBonus: 100,
};

function getStoredLoyalty() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.loyalty);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveLoyalty(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.loyalty, JSON.stringify(data));
  } catch (error) {
    console.warn("[Loyalty] Failed to save:", error);
  }
}

export function LoyaltyProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredLoyalty();
    if (stored) {
      setUser(stored);
    } else {
      setUser({
        id: `user-${Date.now()}`,
        points: POINTS_CONFIG.signupBonus,
        totalSpent: 0,
        totalOrders: 0,
        joinedAt: Date.now(),
        birthday: null,
        referredBy: null,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      saveLoyalty(user);
    }
  }, [user, loading]);

  const currentTier = useMemo(() => {
    if (!user) return LOYALTY_TIERS[0];
    return [...LOYALTY_TIERS].reverse().find((tier) => user.points >= tier.minPoints) || LOYALTY_TIERS[0];
  }, [user]);

  const nextTier = useMemo(() => {
    const currentIndex = LOYALTY_TIERS.findIndex((t) => t.id === currentTier.id);
    return currentIndex < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[currentIndex + 1] : null;
  }, [currentTier]);

  const pointsToNextTier = useMemo(() => {
    if (!nextTier || !user) return 0;
    return nextTier.minPoints - user.points;
  }, [nextTier, user]);

  const progressToNextTier = useMemo(() => {
    if (!nextTier || !user) return 0;
    const tierSpan = nextTier.minPoints - currentTier.minPoints;
    return Math.min(100, Math.max(0, ((user.points - currentTier.minPoints) / tierSpan) * 100));
  }, [nextTier, user, currentTier]);

  const addPoints = useCallback((amount, reason = "purchase") => {
    const points = Math.floor((amount / POINTS_CONFIG.perAmount) * POINTS_CONFIG.pointsEarned);
    
    setUser((prev) => ({
      ...prev,
      points: prev.points + points,
    }));

    return points;
  }, []);

  const deductPoints = useCallback((amount) => {
    if (!user || user.points < amount) return false;
    
    setUser((prev) => ({
      ...prev,
      points: prev.points - amount,
    }));
    
    return true;
  }, []);

  const calculateDiscount = useCallback(() => {
    return currentTier.discount || 0;
  }, [currentTier]);

  const recordOrder = useCallback((amount) => {
    setUser((prev) => ({
      ...prev,
      totalSpent: prev.totalSpent + amount,
      totalOrders: prev.totalOrders + 1,
    }));
  }, []);

  const addReferralBonus = useCallback((referralCode) => {
    setUser((prev) => ({
      ...prev,
      referredBy: referralCode,
      points: prev.points + POINTS_CONFIG.referralBonus,
    }));
  }, []);

  const addReviewBonus = useCallback(() => {
    setUser((prev) => ({
      ...prev,
      points: prev.points + POINTS_CONFIG.reviewBonus,
    }));
  }, []);

  const setBirthday = useCallback((date) => {
    setUser((prev) => ({
      ...prev,
      birthday: date,
      points: prev.birthday ? prev.points : prev.points + POINTS_CONFIG.birthdayBonus,
    }));
  }, []);

  const getAvailableRewards = useMemo(() => {
    if (!user) return [];
    return [
      { id: "r1", name: "100 points - 5% réduction", cost: 100, type: "discount", value: 5 },
      { id: "r2", name: "250 points - 10% réduction", cost: 250, type: "discount", value: 10 },
      { id: "r3", name: "500 points - Livraison gratuite", cost: 500, type: "shipping", value: 0 },
      { id: "r4", name: "300 points - 1 livre gratuit", cost: 300, type: "book", value: 1 },
    ].filter((r) => r.cost <= user.points);
  }, [user]);

  const value = {
    user,
    loading,
    currentTier,
    nextTier,
    pointsToNextTier,
    progressToNextTier,
    tiers: LOYALTY_TIERS,
    config: POINTS_CONFIG,
    addPoints,
    deductPoints,
    calculateDiscount,
    recordOrder,
    addReferralBonus,
    addReviewBonus,
    setBirthday,
    availableRewards: getAvailableRewards,
  };

  return (
    <LoyaltyContext.Provider value={value}>
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error("useLoyalty must be used within LoyaltyProvider");
  }
  return context;
}