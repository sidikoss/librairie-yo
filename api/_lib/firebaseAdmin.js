// api/_lib/firebaseAdmin.js
import admin from 'firebase-admin';

let adminApp = null;
let initError = null;

function parseServiceAccountFromJson() {
  const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!jsonStr) return null;
  try {
    const serviceAccount = JSON.parse(jsonStr);
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      console.error('[firebase-admin] Service account JSON invalide: champs manquants');
      return null;
    }
    return {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    };
  } catch (e) {
    console.error('[firebase-admin] Erreur parsing FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
    return null;
  }
}

function normalizePrivateKey(value) {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
  if (!normalized.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('[firebase-admin] Clé privée invalide');
    return null;
  }
  return normalized;
}

function validateServiceAccount(account) {
  if (!account) return null;
  const errors = [];
  if (!account.projectId || typeof account.projectId !== 'string') errors.push('projectId manquant');
  if (!account.clientEmail || !account.clientEmail.includes('@')) errors.push('clientEmail manquant');
  if (!account.privateKey || !account.privateKey.startsWith('-----BEGIN')) errors.push('privateKey manquante');
  if (errors.length > 0) {
    console.error('[firebase-admin] Validation échouée:', errors.join('; '));
    return null;
  }
  return account;
}

function parseServiceAccount() {
  // Priorité au JSON complet (VARCEL var FIREBASE_SERVICE_ACCOUNT_JSON)
  const jsonAccount = parseServiceAccountFromJson();
  if (jsonAccount) return validateServiceAccount(jsonAccount);

  // Fallback aux variables séparées
  const trim = (v) => v ? v.trim() : v;
  const envAccount = {
    projectId: trim(process.env.FIREBASE_PROJECT_ID),
    clientEmail: trim(process.env.FIREBASE_CLIENT_EMAIL),
    privateKey: normalizePrivateKey(trim(process.env.FIREBASE_PRIVATE_KEY)),
  };

  return (envAccount.projectId && envAccount.clientEmail && envAccount.privateKey)
    ? validateServiceAccount(envAccount)
    : null;
}

async function getAdminApp() {
  if (adminApp) return adminApp;
  if (initError) throw initError;

  try {
    if (admin.getApps().length > 0) {
      adminApp = admin.getApps()[0];
      return adminApp;
    }

    const serviceAccount = parseServiceAccount();
    if (!serviceAccount) throw new Error('Configuration Firebase Admin manquante');

    const options = {
      credential: admin.cert(serviceAccount),
      databaseAuthVariableOverride: { uid: 'firebase-admin-service' },
    };

    const databaseUrl = (process.env.FIREBASE_DATABASE_URL || '').trim();
    if (databaseUrl) options.databaseURL = databaseUrl;

    adminApp = admin.initializeApp(options);
    console.log('[firebase-admin] Initialisé avec projectId:', serviceAccount.projectId);
    return adminApp;
  } catch (error) {
    initError = error;
    console.error('[firebase-admin] Erreur:', error.message);
    throw error;
  }
}

export async function getAdminAuth() {
  return admin.getAuth(await getAdminApp());
}

export async function getAdminDatabase() {
  return admin.getDatabase(await getAdminApp());
}

export async function getAdminFirestore() {
  return admin.getFirestore(await getAdminApp());
}

export async function getAdminStorage() {
  return admin.getStorage(await getAdminApp());
}

export function isFirebaseAdminConfigured() {
  return parseServiceAccount() !== null;
}

export function getFirebaseProjectId() {
  const account = parseServiceAccount();
  return account?.projectId || null;
}

export { getAdminDatabase as getAdminDb };
