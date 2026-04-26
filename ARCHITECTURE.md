# Architecture Technique - Librairie-YO

Documentation technique complète du projet.

## Table des matières

1. [Aperçu](#aperçu)
2. [Stack Technologique](#stack-technologique)
3. [Architecture des Répertoires](#architecture-des-répertoires)
4. [Flux des Données](#flux-des-données)
5. [API Routes](#api-routes)
6. [Modèles de Données](#modèles-de-données)
7. [Sécurité](#sécurité)
8. [Déploiement](#déploiement)

---

## Aperçu

**Librairie-YO** est une application web complète pour la vente de livres numériques en Guinée, avec :
- Catalogue de livres consultable
- Panier et paiement Orange Money
- Lecture sécurisée de PDFs
- Panel d'administration
- Automations n8n

---

## Stack Technologique

### Frontend
```
React 18.3.1       → Framework UI
React Router 6.30  → Navigation
Tailwind CSS 3.4  → Styling
Vite 5.4           → Build tool
Workbox 7.4        → PWA/Service Worker
```

### Backend (Serverless)
```
Vercel Functions   → API routes
Firebase Admin SDK → Database access
```

### Infrastructure
```
Vercel             → Hébergement + CDN
Firebase           → Firestore + Auth + Storage
n8n (ngrok)        → Automations
```

---

## Architecture des Répertoires

```
librairie-yo/
├── src/
│   ├── App.jsx              # Routes principales (React Router)
│   ├── main.jsx             # Point d'entrée React
│   ├── index.css            # Styles globaux + Tailwind
│   │
│   ├── components/          # Composants réutilisables
│   │   ├── books/           # BookCard, BookGrid
│   │   ├── home/            # HeroSection, CustomerTrustSection
│   │   ├── layout/          # RootLayout (header/footer)
│   │   ├── seo/             # SEO component (Helmet)
│   │   └── ui/              # Badge, PriceTag, RatingStars...
│   │
│   ├── context/             # React Context (State Management)
│   │   ├── CartContext.jsx  # Gestion du panier
│   │   └── CatalogContext.jsx # Catalogue + Firebase sync
│   │
│   ├── features/            # Logique métier par domaine
│   │   ├── catalog/         # Normalisation livres
│   │   ├── checkout/        # Validation, calcul panier
│   │   └── whatsapp/        # Intégration WhatsApp
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useLocalStorageState.js
│   │
│   ├── pages/               # Pages principales (Routes)
│   │   ├── HomePage.jsx
│   │   ├── CatalogPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── FavoritesPage.jsx
│   │   ├── OrdersPage.jsx
│   │   ├── SecureReaderPage.jsx
│   │   ├── AdminPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── services/            # Services API
│   │   ├── firebaseClient.js  # Auth Firebase (côté client)
│   │   ├── firebaseApi.js    # Firestore operations
│   │   ├── bookService.js    # CRUD livres
│   │   ├── orderService.js   # Gestion commandes
│   │   ├── n8nEvents.js      # Webhooks n8n
│   │   └── claudeClient.js   # Intégration Claude AI
│   │
│   ├── utils/               # Utilitaires purs
│   │   ├── format.js         # formatGNF, normalizePhone...
│   │   └── crypto.js         # hashPIN, secureCompare...
│   │
│   └── tests/               # Tests unitaires
│       ├── setupTests.js
│       ├── format.test.js
│       ├── crypto.test.js
│       └── checkoutValidation.test.js
│
├── api/                     # Vercel Serverless Functions
│   ├── _lib/
│   │   ├── firebaseAdmin.js  # Initialisation Firebase Admin
│   │   ├── rateLimiter.js   # Rate limiting middleware
│   │   └── telegramAdmin.js # Notifications Telegram
│   │
│   ├── admin-auth.js        # Auth admin (HMAC-SHA256)
│   ├── admin-update-order.js
│   ├── orange-money-verify.js # Vérification paiement
│   ├── orange-money-status.js
│   ├── paycard-*.js         # Paiement par carte
│   ├── n8n-event.js         # Proxy n8n
│   ├── telegram-webhook.js
│   ├── validate-promo.js
│   ├── claude.js
│   └── reader/pdf.js
│
├── public/                  # Assets statiques
│   ├── covers/              # Images livres
│   ├── favicon.png
│   ├── pwa-*.png            # Icônes PWA
│   └── sw.js                # Service Worker
│
├── docs/                    # Documentation
│   ├── N8N_WORKFLOWS_SETUP.md
│   ├── ORANGE_MONEY_PAYMENT.md
│   ├── READER_SETUP.md
│   └── TELEGRAM_ADMIN_SETUP.md
│
├── dist/                    # Build production (généré)
├── .env.example             # Template variables d'environnement
├── vite.config.js
├── tailwind.config.js
├── vitest.config.js         # Configuration tests
├── .eslintrc.js             # Configuration ESLint
├── .prettierrc              # Configuration Prettier
└── package.json
```

---

## Flux des Données

### Parcours Utilisateur

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              UTILISATEUR                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. NAVIGATION                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│  │   Home   │───▶│ Catalogue│───▶│  Panier  │───▶│Checkout │                 │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                 │
│       │                                                   │                  │
│       │                                                   ▼                  │
│       │                                           ┌──────────────┐           │
│       │                                           │Orange Money │           │
│       │                                           │  Payment    │           │
│       │                                           └──────────────┘           │
│       │                                                   │                  │
│       │                                                   ▼                  │
│       │                                           ┌──────────────┐           │
│       │                                           │  Commande    │           │
│       │                                           │  Créée       │           │
│       │                                           └──────────────┘           │
│       │                                                   │                  │
│       ▼                                                   ▼                  │
│  ┌──────────┐                                    ┌──────────────┐           │
│  │ Favoris  │                                    │  Confirmation│           │
│  └──────────┘                                    └──────────────┘           │
│       │                                                   │                  │
│       ▼                                                   ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      LECTURE PDF SÉCURISÉE                           │   │
│  │  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐        │   │
│  │  │ /lecture │───▶│Firebase  │───▶│ Auth     │───▶│  PDF     │        │   │
│  │  │ ?id=XXX  │    │ Firestore│    │ Anonyme  │    │ Secure   │        │   │
│  │  └──────────┘    └──────────┘    └──────────┘    └──────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Flux Admin

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                               ADMIN                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. AUTHENTIFICATION                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐                 │
│  │ /admin   │───▶│  Login   │───▶│ API      │───▶│  Token   │                 │
│  │          │    │  Form    │    │/api/auth │    │  HMAC    │                 │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘                 │
│                                                            │                  │
└────────────────────────────────────────────────────────────┼──────────────────┘
                                                             │
                                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. DASHBOARD                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │    ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐             │   │
│  │    │  Stats  │   │ Catalog │   │ Orders  │   │ Promos  │             │   │
│  │    │  Tab    │──▶│  Tab    │──▶│  Tab    │──▶│  Tab    │             │   │
│  │    └─────────┘   └─────────┘   └─────────┘   └─────────┘             │   │
│  │         │              │             │             │                   │   │
│  │         ▼              ▼             ▼             ▼                   │   │
│  │    ┌─────────────────────────────────────────────────────┐          │   │
│  │    │              FIREBASE FIRESTORE                      │          │   │
│  │    │  • books/    • orders/    • promoCodes/    • users/  │          │   │
│  │    └─────────────────────────────────────────────────────┘          │   │
│  │                               │                                       │   │
│  │                               ▼                                       │   │
│  │    ┌─────────────────────────────────────────────────────┐          │   │
│  │    │                    n8n AUTOMATION                     │          │   │
│  │    │  • Notifications Telegram                             │          │   │
│  │    │  • Emails confirmation                                │          │   │
│  │    │  • Updates stock                                      │          │   │
│  │    └─────────────────────────────────────────────────────┘          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Routes

### Endpoints Publics

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/admin-auth` | Authentification admin (rate-limited) |
| POST | `/api/orange-money-verify` | Vérification paiement (rate-limited) |
| GET | `/api/orange-money-status` | Statut transaction |
| POST | `/api/validate-promo` | Validation code promo |
| POST | `/api/paycard-init` | Initialisation paiement carte |
| POST | `/api/paycard-verify` | Vérification paiement carte |

### Endpoints Internes

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/n8n-event` | Proxy automation n8n |
| POST | `/api/telegram-webhook` | Webhook Telegram |
| POST | `/api/admin-update-order` | Mise à jour statut commande |
| GET | `/api/reader/pdf` | Génération PDF sécurisé |
| GET | `/api/claude` | Intégration Claude AI |

### Rate Limiting

| Route | Limite | Fenêtre |
|-------|--------|---------|
| `/api/admin-auth` | 5 req | 1 minute |
| `/api/orange-money-verify` | 10 req | 1 minute |
| `/api/orange-money-status` | 30 req | 1 minute |
| `/api/validate-promo` | 20 req | 1 minute |
| Default | 100 req | 1 minute |

---

## Modèles de Données

### Firestore Collections

```javascript
// books/{bookId}
{
  id: string,
  title: string,
  author: string,
  pages: number,
  category: string,
  image: string?,
  description: string?,
  rating: number,
  price: number,
  discount: number,
  stock: number,
  featured: boolean,
  isNew: boolean,
  createdAt: timestamp,
  fileId: string?,
  manualPrice: number?,
  manualPriceEnabled: boolean
}

// orders/{orderId}
{
  id: string,
  name: string,
  phone: string,
  pin: string,
  txId: string,
  referencePaiement: string,
  status: "pending" | "approved" | "rejected",
  total: number,
  originalTotal: number,
  discount: number,
  promoCode: string?,
  items: [{
    bookId: string,
    title: string,
    qty: number,
    price: number
  }],
  uid: string?,
  createdAt: timestamp,
  updatedAt: timestamp
}

// promoCodes/{promoId}
{
  id: string,
  code: string,
  discount: number,
  type: "percent" | "fixed",
  maxUses: number,
  uses: number,
  active: boolean,
  createdAt: timestamp
}

// bookFiles/{fileId}
{
  id: string,
  bookId: string,
  fileName: string,
  fileType: string,
  fileData: string, // base64
  createdAt: timestamp
}
```

---

## Sécurité

### Mesures Implémentées

| Mesure | Implémentation |
|--------|----------------|
| **Auth Admin** | HMAC-SHA256 tokens avec expiration 2h |
| **Rate Limiting** | Limite par IP + ban temporaire |
| **Timing-Safe Compare** | Protection contre timing attacks |
| **Input Validation** | Validation stricte côté serveur |
| **CORS** | Headers configurés par Vercel |
| **HTTPS** | Force HTTPS via Vercel |

### Variables d'Environnement Sensibles

```bash
# Server-side only (jamais exposé au client)
ADMIN_PASSWORD
FIREBASE_PRIVATE_KEY

# Client-side (exposé au bundle - mais pas sensible)
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
```

### Points d'Attention

1. **PIN en clair** → À hasher côté client avec `src/utils/crypto.js`
2. **Simulation Orange Money** → À remplacer par API réelle
3. **localStorage payments** → À migrer vers Firestore server-side

---

## Déploiement

### Prérequis

1. Compte [Vercel](https://vercel.com)
2. Projet [Firebase](https://console.firebase.google.com)
3. (Optionnel) Instance n8n avec ngrok

### Configuration

1. **Cloner le projet**
   ```bash
   git clone <repo-url>
   cd librairie-yo
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   cp .env.example .env.local
   # Éditer .env.local avec vos valeurs
   ```

4. **Déployer sur Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

5. **Configurer les Environment Variables sur Vercel**
   - Aller dans Project Settings > Environment Variables
   - Ajouter toutes les variables du `.env.example`

### Commandes Utiles

```bash
# Développement local
npm run dev

# Tests
npm test              # Exécuter les tests
npm run test:coverage # Avec couverture

# Linting
npm run lint          # Vérifier
npm run lint:fix      # Corriger automatiquement

# Build
npm run build         # Build production
npm run preview       # Prévisualiser le build
```

### Structure des Logs

```javascript
// Format des logs serveur
[ServiceName] Message {key=value} ...
```

---

## Support

Pour toute question technique, consultez :
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Firebase](https://firebase.google.com/docs)
- [Issues GitHub](https://github.com/your-repo/issues)