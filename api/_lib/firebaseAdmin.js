import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

let app = null;

function getServiceAccount() {
  // Priorité 1 : JSON complet
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json);
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key?.replace(/\\n/g, '\n'),
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
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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

  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });

  console.log('[firebase-admin] initialized:', serviceAccount.projectId);
  return app;
}

export function getAdminDatabase() {
  return getDatabase(getAdminApp());
}

export function isFirebaseAdminConfigured() {
  const sa = getServiceAccount();
  return sa !== null;
}
