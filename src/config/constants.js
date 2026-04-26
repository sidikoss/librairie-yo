/**
 * Librairie YO - Configuration Centralisée
 * @module config/constants
 * @description Toutes les constantes de l'application
 */

export const APP_NAME = "Librairie YO";
export const APP_URL = "https://librairie-yo-gui.vercel.app";
export const SUPPORT_EMAIL = "contact@librairie-yo-gui.vercel.app";

export const FIREBASE_DB_URL = "https://librairie-yo-default-rtdb.firebaseio.com";

export const OM_NUMBER = "613908784";
export const WA_NUMBER = "224661862044";

export const PRICING_CONFIG = {
  basePrice: 5000,
  firstTierMaxPages: 150,
  extraTierPages: 100,
  extraTierPrice: 5000,
  maxPrice: 25000,
};

export const TIMEOUTS = {
  default: 10000,
  upload: 60000,
  download: 30000,
};

export const CACHE_CONFIG = {
  booksTTL: 5 * 60 * 1000,
  maxSize: 50,
};

export const STORAGE_KEYS = {
  booksCache: "yo_books_v4",
  cart: "yo_cart_v2",
  wishlist: "yo_wishlist",
  adminSession: "yo_adm_sess",
  csrfToken: "yo_csrf_token",
  rateLimits: "yo_rate_limits",
  reviews: "yo_reviews",
  loyalty: "yo_loyalty",
  priceAlerts: "yo_price_alerts",
  orders: "yo_orders",
  viewHistory: "yo_view_history",
  orderTracking: "yo_order_tracking",
  analytics: "yo_analytics",
};

export const UI_CONFIG = {
  toastDuration: 4000,
  animationDuration: 300,
  pageSize: 20,
  gridBreakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
};

export const FEATURES = {
  enablePdfReader: true,
  enableWhatsApp: true,
  enableOrangeMoney: true,
  enablePWA: true,
  enableAnalytics: true,
};

export const ROUTES = {
  HOME: "/",
  CATALOGUE: "/catalogue",
  CART: "/panier",
  CHECKOUT: "/checkout",
  FAVORITES: "/favoris",
  ORDERS: "/commandes",
  READER: "/lecture",
  ADMIN: "/admin",
};

export const TRUST_BANNER = "Livraison rapide en Guinée";

export const BASE_CATEGORIES = [
  "Roman",
  "Science",
  "Histoire",
  "Philosophie",
  "Manga",
  "Religion & Spiritualité",
  "Développement personnel",
  "Informatique",
  "Jeunesse",
  "Poésie",
  "Biographie",
  "Entrepreneur",
  "Étudiant",
  "Lycéen",
  "Finance & Investissement",
  "Santé & Bien-être",
  "Art & Créativité",
  "Géopolitique",
  "Langues",
  "Psychologie",
  "Autre",
];

export const GUINEA_PRIORITY_CATEGORIES = [
  "Droit",
  "Informatique",
  "Comptabilité",
  "Entrepreneuriat",
];

export const CATEGORIES = Array.from(
  new Set([...BASE_CATEGORIES, ...GUINEA_PRIORITY_CATEGORIES])
);

export const CUSTOMER_REVIEWS = [
  {
    id: "r1",
    name: "M. Bangoura",
    rating: 5,
    text: "Commande simple sur WhatsApp, réponse rapide et livraison immédiate.",
  },
  {
    id: "r2",
    name: "A. Diallo",
    rating: 5,
    text: "Catalogue clair, paiement Orange Money facile, service très pro.",
  },
  {
    id: "r3",
    name: "F. Camara",
    rating: 4,
    text: "Très pratique sur mobile. J'ai trouvé mes livres d'informatique rapidement.",
  },
];

export const ORDER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: "En attente",
  [ORDER_STATUS.APPROVED]: "Approuvée",
  [ORDER_STATUS.REJECTED]: "Rejetée",
  [ORDER_STATUS.SHIPPED]: "Expédiée",
  [ORDER_STATUS.DELIVERED]: "Livrée",
};

export const LIMITS = {
  maxBooksPerOrder: 10,
  maxQuantityPerBook: 1,
  minOrderAmount: 1000,
  maxDescriptionLength: 500,
  maxTitleLength: 100,
  maxAuthorLength: 100,
};

export const ERROR_MESSAGES = {
  network: "Erreur de connexion. Vérifiez votre connexion internet.",
  server: "Erreur serveur. Réessayez plus tard.",
  notFound: " Ressource non trouvée.",
  unauthorized: "Accès non autorisé.",
  validation: "Données invalides.",
  payment: "Erreur de paiement. Réessayez.",
};

export const SUCCESS_MESSAGES = {
  addedToCart: "Ajouté au panier",
  removedFromCart: "Retiré du panier",
  orderPlaced: "Commande enregistrée",
  profileUpdated: "Profil mis à jour",
};