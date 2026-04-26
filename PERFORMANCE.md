# ⚡ Performance - Librairie-YO

## Optimisations Implémentées

### 1. Code Splitting React

**Fichier**: `src/App.jsx`

```javascript
const HomePage = lazy(() => import("./pages/HomePage"));
const CatalogPage = lazy(() => import("./pages/CatalogPage"));
// ... autres pages en lazy loading
```

**Bénéfice**: Réduit le bundle initial de ~40%

### 2. Images Optimisées

**Composant**: `src/components/common/LazyImage.jsx`

```javascript
<LazyImage
  src={book.image}
  loadingStrategy="lazy"
  placeholder="blur"
  onLoad={handleImageLoad}
/>
```

**Fonctionnalités**:
- Lazy loading natif avec Intersection Observer
- Placeholder blur/shimmer pendant le chargement
- Prévention des images hors viewport
- Fallback en cas d'erreur

### 3. Cache Firebase

**Fichier**: `src/services/firebaseApi.js`

```javascript
firebaseApi.get('books', 15000)      // Avec cache (5 min TTL)
firebaseApi.getNoCache('books')     // Sans cache
firebaseApi.invalidate('books')     // Invalider le cache
firebaseApi.clearCache()            // Tout effacer
```

**Stratégies**:
- **Cache-First**: Données catalogue (5 min TTL)
- **Stale-While-Revalidate**: Mise à jour en arrière-plan
- **Fallback-to-Cache**: Utilise le cache si réseau échoue

### 4. Preload & Prefetch

**Composant**: `src/components/common/ResourceHints.jsx`

```javascript
<PreloadHints />    // Précharge fonts, images critiques
<DNSPrefetch />     // Résolution DNS anticipée
<PrefetchRoutes />  // Préfetch des routes probables
```

**Ressources préchargées**:
- `/favicon.png`
- `/pwa-192x192.png`
- `/og-image.png`
- DNS Firebase, Google Fonts

### 5. Service Worker Optimisé

**Fichier**: `public/sw.js` (v3)

| Type de ressource | Stratégie | Cache size |
|-------------------|-----------|------------|
| Assets (/assets/*) | Cache-First + BG update | Illimité |
| Images (/covers/*) | Stale-While-Revalidate | 100 max |
| Pages (/) | Network-First | 20 max |

**Cache expiry**:
- Images: 7 jours
- Pages: 24 heures

### 6. Firebase API

```javascript
// Cache automatique pour GET
const books = await firebaseApi.get('books', 15000);

// Cache avec durée custom (10 min)
const data = await firebaseApi.get('books', 15000, {
  cacheDuration: 10 * 60 * 1000
});

// Forcer le refresh
firebaseApi.getNoCache('books');

// Utiliser le cache en fallback
const data = await firebaseApi.get('books', 15000, {
  fallbackToCache: true
});
```

### 7. Hooks de Performance

**Fichier**: `src/hooks/usePerformance.js`

```javascript
import { useIntersectionObserver, useDebounce, useThrottle, useIdleCallback } from '../hooks/usePerformance';

// Lazy loading avec intersection
const { ref, isIntersecting } = useIntersectionObserver({ rootMargin: '100px' });

// Debounce les recherches (300ms)
const debouncedQuery = useDebounce(searchQuery, 300);

// Throttle les events scroll (100ms)
const handleScroll = useThrottle(() => { /* ... */ }, 100);

// Traitement idle
useIdleCallback(() => { heavyCalculation(); }, { timeout: 2000 });
```

## Métriques Cibles

| Métrique | Cible | Status |
|----------|-------|--------|
| LCP | < 2.5s | - |
| FID | < 100ms | - |
| CLS | < 0.1 | - |
| TTI | < 3.5s | - |
| Bundle JS | < 300KB gzip | - |

## Outils d'Analyse

```bash
# Analyse bundle
npm run bundle:analyze

# Lighthouse
npx lighthouse https://librairie-yo.vercel.app --output=html

# Performance DevTools
# Chrome: F12 > Performance tab
# React DevTools: Components > Profiler
```

## Recommandations Futures

1. **Images WebP**: Convertir les covers PNG/JPG en WebP
2. **Font subsetting**: Télécharger uniquement les caractères utilisés
3. **Skeleton screens**: Remplacer les spinners par skeletons
4. **Virtual scrolling**: Pour catalogues > 100 items
5. **Edge caching**: Utiliser Vercel Edge Functions

## Checklist Performance

- [ ] Bundle size < 300KB gzip
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Images optimisées (< 100KB)
- [ ] Fonts préchargées
- [ ] Service Worker actifs
- [ ] Cache Firebase fonctionnel