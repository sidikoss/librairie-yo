// api/_lib/firebaseAdmin.js

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

let app = null;

/**
 * Normalise la private key (Vercel casse souvent les \n)
 */
function normalizePrivateKey(key) {
  if (!key) return null;
  return key.replace(/\\n/g, '\n');
}

/**
 * Récupère le service account depuis JSON (prioritaire)
 */
function getServiceAccountFromJson() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: normalizePrivateKey(parsed.private_key),
    };
  } catch (e) {
    console.error('[firebase-admin] JSON service account invalide:', e.message);
    return null;
  }
}

/**
 * Fallback variables séparées
 */
function getServiceAccountFromEnv() {
  if (!process.env.FIREBASE_PROJECT_ID) return null;

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  };
}

/**
 * Choix automatique de la source
 */
function getServiceAccount() {
  return getServiceAccountFromJson() || getServiceAccountFromEnv();
}

/**
 * Init Firebase Admin (SAFE pour Vercel serverless)
 */
export function getAdminApp() {
  if (app) return app;

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  const serviceAccount = getServiceAccount();

  if (!serviceAccount?.projectId || !serviceAccount?.clientEmail || !serviceAccount?.privateKey) {
    throw new Error('Firebase Admin: service account manquant ou invalide');
  }

  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  console.log('[firebase-admin] initialized:', serviceAccount.projectId);

  return app;
}

/**
 * Database instance
 */
export function getAdminDatabase() {
  return getDatabase(getAdminApp());
}

/**
 * helper debug
 */
export function isFirebaseAdminConfigured() {
  return !!getServiceAccount();
}
