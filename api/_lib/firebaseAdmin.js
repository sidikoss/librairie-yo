import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

let app = null;

function getServiceAccount() {
  // Priorité 1 : JSON complet
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json);
      const privateKey = parsed.private_key;
      
      // Vérifier et corriger le format de la clé
      let normalizedKey = privateKey;
      
      // Si la clé contient des \n littéraux (pas de vrais newlines), les convertir
      if (privateKey && !privateKey.includes('\n') && privateKey.includes('\\n')) {
        normalizedKey = privateKey.replace(/\\n/g, '\n');
      }
      
      // Vérifier que la clé est valide
      if (!normalizedKey || !normalizedKey.includes('-----BEGIN PRIVATE KEY-----')) {
        console.error('[firebase-admin] Clé privée invalide: format incorrect');
        return null;
      }
      
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: normalizedKey,
      };
    } catch (e) {
      console.error('[firebase-admin] Erreur parsing JSON service account:', e.message);
    }
  }
  
  // Priorité 2 : variables séparées
  if (process.env.FIREBASE_PROJECT_ID) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    
    // Normaliser les newlines
    if (privateKey && !privateKey.includes('\n') && privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
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
    throw new Error('Firebase Admin: service account manquant ou invalide');
  }

  console.log('[firebase-admin] Initialisation avec projectId:', serviceAccount.projectId);
  console.log('[firebase-admin] Clé privée commence par:', serviceAccount.privateKey.substring(0, 40));

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
