import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const BundlesContext = createContext(null);

const DEFAULT_BUNDLES = [
  {
    id: "bundle-starter-dev",
    name: "Kit Développeur",
    description: "Tout pour bien commencer en programmation",
    category: "Informatique",
    products: [],
    books: ["book-1", "book-2", "book-3"],
    discount: 15,
    bonus: "Guide gratuit PDF",
    price: 0,
    active: true,
  },
  {
    id: "bundle-romans-classiques",
    name: "Romans Classiques",
    description: "Les grands classiques de la littérature",
    category: "Roman",
    books: ["book-4", "book-5", "book-6"],
    discount: 20,
    bonus: "Marque-page exclusif",
    price: 0,
    active: true,
  },
  {
    id: "bundle-etudes",
    name: "Pack Étudiant",
    description: "Tous les essentiels pour vos études",
    category: "Étudiant",
    books: ["book-7", "book-8"],
    discount: 10,
    bonus: null,
    price: 0,
    active: true,
  },
];

const BUNDLE_TEMPLATES = [
  {
    id: "theme-dev-web",
    name: "Développement Web",
    icon: "code",
    description: "HTML, CSS, JavaScript, React",
  },
  {
    id: "theme-mobile",
    name: "Développement Mobile",
    icon: "phone",
    description: "Flutter, React Native, Swift",
  },
  {
    id: "theme-data",
    name: "Data Science",
    icon: "chart",
    description: "Python, ML, AI",
  },
  {
    id: "theme-business",
    name: "Business",
    icon: "briefcase",
    description: "Marketing, Management",
  },
];

export function BundlesProvider({ children }) {
  const [bundles, setBundles] = useState(DEFAULT_BUNDLES);

  const activeBundles = useMemo(() => {
    return bundles.filter((bundle) => bundle.active);
  }, [bundles]);

  const getBundleById = useCallback(
    (bundleId) => bundles.find((b) => b.id === bundleId),
    [bundles]
  );

  const getBundlesByCategory = useCallback(
    (category) => activeBundles.filter((b) => b.category === category),
    [activeBundles]
  );

  const calculateBundlePrice = useCallback((bundle, products) => {
    const originalTotal = products.reduce((sum, p) => sum + (p.price || 0), 0);
    const discount = originalTotal * (bundle.discount / 100);
    const finalPrice = originalTotal - discount;
    const savings = discount;

    return {
      originalTotal,
      discount,
      finalPrice,
      savings,
      bonus: bundle.bonus,
    };
  }, []);

  const createCustomBundle = useCallback((name, description, products, discount = 10) => {
    const newBundle = {
      id: `custom-${Date.now()}`,
      name,
      description,
      category: products[0]?.category || "Autre",
      products,
      books: products.map((p) => p.id),
      discount,
      bonus: discount >= 15 ? "Guide gratuit" : null,
      price: 0,
      active: true,
    };

    setBundles((prev) => [...prev, newBundle]);
    return newBundle;
  }, []);

  const value = {
    bundles: activeBundles,
    templates: BUNDLE_TEMPLATES,
    getBundleById,
    getBundlesByCategory,
    calculateBundlePrice,
    createCustomBundle,
  };

  return (
    <BundlesContext.Provider value={value}>
      {children}
    </BundlesContext.Provider>
  );
}

export function useBundles() {
  const context = useContext(BundlesContext);
  if (!context) {
    throw new Error("useBundles must be used within BundlesProvider");
  }
  return context;
}