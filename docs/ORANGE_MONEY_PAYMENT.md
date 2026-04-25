# Paiement Orange Money - Documentation Technique

## Overview

Système de paiement manuel Orange Money pour la Guinée, intégré à Librairie YO.

## Fonctionnement

### Flux Utilisateur

1. **Initiation** : L'utilisateur clique "Payer avec Orange Money"
2. **Génération USSD** : Le code USSD est généré automatiquement avec le montant
   ```
   *144*1*1*NUMERO_MARCHAND*MONTANT*1#
   ```
3. **Paiement** : L'utilisateur compose le code sur son téléphone
4. **Référence** : Il reçoit un SMS avec une référence (ex: `A58452`)
5. **Validation** : Il entre la référence sur le site
6. **Vérification** : Le backend vérifie la référence (anti-doublon, format)
7. **Confirmation** : Accès aux livres si paiement validé

### Code USSD

```javascript
const ussdCode = `*144*1*1*${OM_NUMBER}*${montant}*1#`;
// Exemple: *144*1*1*613908784*10000*1#
```

### Extraction de Référence

Le système peut extraire automatiquement la référence depuis un SMS complet :

```javascript
// SMS reçu: "Bonjour, Envoi de:10000GNF vers le 613908784, reference:PP234567.019.A58452. Orange Money vous remercie"
// Référence extraite: "A58452"
```

## API Endpoints

### POST /api/orange-money-verify

Vérification d'un paiement Orange Money.

**Request:**
```json
{
  "txId": "A58452",
  "amount": 10000,
  "name": "John Doe",
  "phone": "224612345678",
  "pin": "1234"
}
```

**Response (succès):**
```json
{
  "success": true,
  "orderId": "OM_1234567890_1234",
  "message": "Paiement vérifié avec succès",
  "amount": 10000,
  "reference": "A58452"
}
```

**Response (erreur):**
```json
{
  "error": "Référence déjà utilisée",
  "code": "REF_ALREADY_USED"
}
```

### GET /api/orange-money-status?ref=REFERENCE

Vérifie le statut d'une référence de paiement.

**Response:**
```json
{
  "status": "VERIFIED",
  "orderId": "OM_1234567890_1234",
  "amount": 10000,
  "verifiedAt": 1234567890000
}
```

## Configuration

### Variables d'Environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `OM_NUMBER` | Numéro marchand Orange | `613908784` |
| `APP_PUBLIC_URL` | URL du site | `https://librairie-yo.vercel.app` |

### Configuration Firebase

Le système utilise Firebase Realtime Database pour stocker les commandes. Assurez-vous d'avoir les credentials configurés.

## Sécurité

### Validations

- **PIN** : Exactement 4 chiffres
- **Référence** : Alphanumérique uniquement (`/^[A-Za-z0-9]+$/`)
- **Montant** : Nombre positif
- **Phone** : Format Guinea (`2246...`)

### Anti-Doublon

Les références utilisées sont stockées avec un TTL de 24h :
- Stockage : `localStorage` (clé: `yo_payment_refs`)
- Vérification avant chaque transaction
- Nettoyage automatique après expiration

### Rate Limiting

- Limite : 3 requêtes/minute par IP
- Timeout : 3 secondes par appel API

## Intégration Future (API Officielle)

### Étape 1: Obtenir Credentials

Contacter Orange Guinée pour obtenir :
- `ORANGE_MERCHANT_ID`
- `ORANGE_API_KEY`
- `ORANGE_WEBHOOK_SECRET`

### Étape 2: Remplacer Simulateur

```javascript
// Avant (simulateur)
const isSuccess = Math.random() < 0.85;

// Après (vraie API)
const response = await fetch('https://api.orangemoney.gn/v1/verify', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ORANGE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reference: txId,
    amount: amount
  })
});
```

### Étape 3: Webhook

Configurer le webhook pour recevoir les notifications de paiement :

```
POST /api/orange-money-webhook
```

**Payload:**
```json
{
  "event": "payment.completed",
  "transactionId": "OM123456",
  "reference": "A58452",
  "amount": 10000,
  "status": "SUCCESS",
  "timestamp": "2026-01-15T10:30:00Z",
  "signature": "hmac-sha256-signature"
}
```

## Base de Données

### Schéma

Voir `docs/migrations/001_orange_money_payments.sql`

### Tables Principales

- `orange_money_payments` : Historique des paiements
- `orders` : Commandes avec mode de paiement

### Fonctions SQL

- `is_reference_available(ref)` : Vérifie disponibilité référence
- `record_payment(...)` : Enregistre nouveau paiement
- `verify_payment(ref, orderId)` : Valide un paiement
- `mark_payment_failed(ref, reason)` : Marque paiement échoué
- `cleanup_expired_payments()` : Nettoie les anciens paiements

## Tests

### Test Manuel

```bash
# Test vérification paiement
curl -X POST https://librairie-yo-gui.vercel.app/api/orange-money-verify \
  -H "Content-Type: application/json" \
  -d '{
    "txId": "TEST123",
    "amount": 10000,
    "name": "Test User",
    "phone": "224612345678",
    "pin": "1234"
  }'
```

### Test Automatisé

Voir `src/tests/paymentValidation.test.js`

## Dépannage

### Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `REF_ALREADY_USED` | Référence déjà utilisée | Utiliser une nouvelle référence |
| `VERIFICATION_FAILED` | Paiement non trouvé | Vérifier le paiement Orange Money |
| `Référence invalide` | Mauvais format | Utiliser uniquement lettres et chiffres |

### Debug

Les logs sont disponibles dans la console du navigateur et les logs serveur Vercel.

## Contributing

1. Créer une branche `feature/payment-`
2. Tester localement avec `npm run dev`
3. Pusher les changements
4. Créer une PR pour review

## License

MIT - Librairie YO