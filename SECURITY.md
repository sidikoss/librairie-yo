# 🔒 Sécurité - Librairie-YO

## Vue d'ensemble

Ce document détaille les mesures de sécurité implémentées pour protéger l'application.

## Mesures Implémentées

### 1. Headers de Sécurité HTTP

**Fichier**: `api/_lib/securityHeaders.js`

```javascript
// Headers appliqués à toutes les réponses API
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- Content-Security-Policy: strikte policy
- Strict-Transport-Security: max-age=31536000
- Cache-Control: no-store, no-cache
```

### 2. Rate Limiting

**Fichier**: `api/_lib/rateLimiter.js`

| Endpoint | Limite | Fenêtre | Ban après |
|----------|--------|---------|-----------|
| `/api/admin-auth` | 5 req | 1 min | 10 violations |
| `/api/orange-money-verify` | 10 req | 1 min | 10 violations |
| `/api/validate-promo` | 20 req | 1 min | 10 violations |
| Default | 100 req | 1 min | 10 violations |

**Durée du ban**: 15 minutes

### 3. Validation des Données

**Fichier**: `api/_lib/schemaValidator.js`

Validation stricte des entrées:
- `validatePhone()` - Numéro guinéen (9-15 chiffres)
- `validatePIN()` - PIN 4 chiffres uniquement
- `validateTxId()` - Alpha-numérique + tirets/underscores
- `validateAmount()` - Montant entre 100 et 100M GNF
- `validateOrangeMoneyPayment()` - Schéma complet du paiement
- `validateAdminAuth()` - Schéma authentification

### 4. Sanitization XSS/SQL

**Fichier**: `api/_lib/sanitization.js`

```javascript
// Détection et suppression de:
// - <script>, onerror=, javascript:, etc.
// - Patterns SQL: UNION, SELECT, DROP, etc.
// - Characters dangereux HTML
// - Null bytes et caractères de contrôle
```

### 5. Hachage des Données Sensibles

**Fichier**: `src/utils/crypto.js`

```javascript
// hashPIN(pin) → SHA-256 hash (64 caractères hex)
// validatePINFormat(pin) → validation stricte
// generateSecureToken(length) → token aléatoire sécurisé
// secureCompare(a, b) → comparaison timing-safe
```

### 6. Monitoring de Sécurité

**Fichier**: `api/_lib/securityMonitor.js`

```javascript
// Événements journalisés:
// - AUTH_SUCCESS / AUTH_FAILURE
// - BRUTE_FORCE_DETECTED
// - XSS_DETECTED / SQL_INJECTION_DETECTED
// - PAYMENT_SUCCESS / PAYMENT_SIMULATION_FAILED
// - VALIDATION_ERROR

// Statistiques disponibles:
// - getSecurityStats() → résumé 24h
// - getSecurityLogs(limit, filters) → logs filtrés
// - getTopOffenders() → IPs suspectes
```

### 7. Configuration Firebase Admin Sécurisée

**Fichier**: `api/_lib/firebaseAdmin.js`

```javascript
// Validation stricte:
// - Format de clé privée vérifié
// - Validation projectId, clientEmail
// - Auth variable override avec UID service
// - URL database validée (https://)
```

## Flux de Sécurité

```
Requête Client
      │
      ▼
┌─────────────────┐
│ Rate Limiter    │ ◄── Bloque si trop de requêtes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Security Headers│ ◄── Ajoute headers HTTP
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Sanitization    │ ◄── Nettoie XSS/SQL
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Schema Validate │ ◄── Valide format données
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Security Monitor│ ◄── Log événement
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Handler         │ ◄── Traitement métier
└─────────────────┘
```

## Variables d'Environnement Sécurisées

```bash
# ADMIN_PASSWORD (CRITIQUE)
# - Longueur minimum: 16 caractères
# - Stockage: Vercel Environment Variables
# - Jamais commitée dans le repo

# FIREBASE_PRIVATE_KEY (CRITIQUE)
# - Format: PEM avec \n échappés
# - Validation automatique du format
```

## Tests de Sécurité

```bash
# Exécuter les tests
npm test

# Tests spécifiques sécurité
npm run test -- --grep "crypto"
```

## Alertes et Monitoring

Les événements de sécurité sont journalisés avec:
- Timestamp
- Adresse IP
- User Agent
- Type d'événement
- Gravité (CRITICAL/HIGH/MEDIUM)

Pour les événements CRITICAL, une notification est émise dans les logs serveur.

## Bonnes Pratiques

1. **PIN utilisateur**: Jamais stocké en clair, uniquement hashé
2. **Tokens admin**: Expiration 2h, HMAC-SHA256 signés
3. **Comparaison sécurisée**: timingSafeEqual pour éviter les timing attacks
4. **Rate limiting**: Protection contre brute force
5. **Validation stricte**: Schéma défini pour chaque endpoint

## Limitations Connues

1. **Orange Money API**: Simulation à 85% - intégration réelle à venir
2. **Payment refs storage**: Server-side (MAP en mémoire) - persistance à améliorer
3. **Logs memory**: Limités à 1000 entrées, TTL 24h

## Équipe de Sécurité

Pour toute préoccupation sécurité, contactez immédiatement l'équipe de développement.