export const APP_NAME = "Librairie YO";

// Existing production credentials/constants kept to avoid backend breakage.
export const ADMIN_PASSWORD = "papiraro2143";
export const FIREBASE_DB_URL = "https://librairie-yo-default-rtdb.firebaseio.com";
export const OM_NUMBER = "224613908784";
export const WA_NUMBER = "224661862044";

export const PRICING_CONFIG = {
  basePrice: 5000,
  firstTierMaxPages: 150,
  extraTierPages: 100,
  extraTierPrice: 5000,
  maxPrice: 25000,
};

export const STORAGE_KEYS = {
  booksCache: "yo_books_v4",
  cart: "yo_cart_v2",
  wishlist: "yo_wishlist",
  adminSession: "yo_adm_sess",
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
  new Set([...BASE_CATEGORIES, ...GUINEA_PRIORITY_CATEGORIES]),
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
    text: "Très pratique sur mobile. J’ai trouvé mes livres d’informatique rapidement.",
  },
];
