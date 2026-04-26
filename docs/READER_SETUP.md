# Lecteur PDF securise - Setup rapide

## 1) Variables Vercel (obligatoire)

Ajoute ces variables dans Vercel Project Settings > Environment Variables:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_DATABASE_URL`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_SERVICE_ACCOUNT_JSON` (optionnel si tu utilises deja les 3 variables ci-dessus)

Optionnelles:

- `READER_ORDER_SOURCE` (`auto`, `firestore`, `rtdb`) - default: `auto`
- `READER_RATE_LIMIT_MAX` - default: `80`
- `READER_ORDERS_COLLECTION` - default: `orders`
- `READER_BOOK_FILES_COLLECTION` - default: `bookFiles`

## 2) Variables front (Vite)

Dans Vercel et en local, ajoute:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

Important:

- Active `Anonymous Auth` dans Firebase Authentication.

## 3) Donnees commande

Pour un controle fort:

- chaque commande doit contenir `uid`
- `status` doit etre `approved`
- le livre doit etre present dans `order.items`

Le checkout met deja `uid` automatiquement quand la session Firebase est disponible.

## 4) Donnees fichiers PDF

Priorite recommandee:

- stocker les PDF dans Firebase Storage prive
- garder un `storagePath` (ou `gsPath`) dans `book-files/{bookId}` ou `bookFiles/{bookId}`

Fallback legacy supporte:

- `fileData` en data URL (migration), mais ce n'est pas recommande a long terme.

## 5) Verification rapide

1. Passe une commande test.
2. Approuve la commande.
3. Ouvre `Mes commandes` puis `Lire en ligne (securise)`.
4. Verifie que:
   - aucun bouton download/print n'apparait
   - le PDF se rend en canvas
   - watermark visible
   - `/api/reader/pdf` repond avec `Cache-Control: no-store`
