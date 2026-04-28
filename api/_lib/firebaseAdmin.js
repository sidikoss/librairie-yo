import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

let app = null;

function normalizePrivateKey(key) {
  if (!key) return null;
  
  // Remplacer les \n littéraux par de vrais newlines
  let normalized = key.replace(/\\n/g, '\n');
  
  // S'assurer que la clé a le bon format PEM
  if (!normalized.includes('-----BEGIN PRIVATE KEY-----')) {
    console.error('[firebase-admin] Clé privée invalide: pas de BEGIN PRIVATE KEY');
    return null;
  }
  
  return normalized;
}

function getServiceAccount() {
  // Priorité 1 : JSON complet
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: normalizePrivateKey(parsed.private_key),
      };
    } catch (e) {
      console.error('[firebase-admin] JSON parse error:', e.message);
    }
  }
  
  // Priorité 2 : variables séparées
  if (process.env.FIREBASE_PROJECT_ID) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    };
  }
  
  return null;
}

export function getAdminApp() {
  if (app) return app;

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const serviceAccount = getServiceAccount();
  if (!serviceAccount?.projectId || !serviceAccount?.privateKey) {
    throw new Error('Firebase Admin: service account missing');
  }

  console.log('[firebase-admin] Initialisation avec projectId:', serviceAccount.projectId);
  console.log('[firebase-admin] privateKey starts with:', serviceAccount.privateKey.substring(0, 50));

  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  return app;
}

export function getAdminDatabase() {
  return getDatabase(getAdminApp());
}

export function isFirebaseAdminConfigured() {
  const sa = getServiceAccount();
  return sa !== null;
}
