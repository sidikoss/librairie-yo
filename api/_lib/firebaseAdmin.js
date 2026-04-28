// api/_lib/firebaseAdmin.js
// Configuration Firebase Admin avec sécurité renforcée

let adminApp = null;
let initError = null;
let firebaseMod = null;

async function loadFirebaseAdmin() {
  if (firebaseMod) return firebaseMod;
  try {
    const mod = await import('firebase-admin');
    // firebase-admin v13 retourne parfois le module dans .default
    firebaseMod = mod.default || mod;
    return firebaseMod;
  } catch (e) {
    console.error('[firebase-admin] Failed to load firebase-admin:', e.message);
    return null;
  }
}

const VALIDATION_ERRORS = [];

function normalizePrivateKey(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const normalized = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
  if (!normalized.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('[firebase-admin] normalizePrivateKey: missing BEGIN PRIVATE KEY');
    return null;
  }
  return normalized;
}

function validateServiceAccount(account) {
  if (!account) return null;
  
  const errors = [];
  
  if (!account.projectId || typeof account.projectId !== 'string') {
    errors.push('projectId manquant ou invalide');
  }
  
  if (!account.clientEmail || !account.clientEmail.includes('@')) {
    errors.push('clientEmail manquant ou invalide');
  }
  
  if (!account.privateKey || !account.privateKey.startsWith('-----BEGIN')) {
    errors.push('privateKey manquante ou malformée');
  }
  
  if (errors.length > 0) {
    console.error('[firebase-admin] Validation échouée:', errors.join('; '));
    return null;
  }
  
  return account;
}

function parseServiceAccount() {
  const trim = (v) => v ? v.trim() : v;
  const PROJECT_ID = trim(process.env.FIREBASE_PROJECT_ID);
  const CLIENT_EMAIL = trim(process.env.FIREBASE_CLIENT_EMAIL);
  const PRIVATE_KEY = trim(process.env.FIREBASE_PRIVATE_KEY);
  
  const envAccount = {
    projectId: PROJECT_ID,
    clientEmail: CLIENT_EMAIL,
    privateKey: normalizePrivateKey(PRIVATE_KEY),
  };

  if (envAccount.projectId && envAccount.clientEmail && envAccount.privateKey) {
    return validateServiceAccount(envAccount);
  }

  return null;
}

async function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }
  
  if (initError) {
    throw initError;
  }
  
  try {
    const mod = await loadFirebaseAdmin();
    if (!mod) {
      throw new Error('firebase-admin non disponible');
    }
    
    // Gestion des deux formats d'export (v12 vs v13)
    const getApps = mod.getApps || (mod.default && mod.default.getApps);
    const initializeApp = mod.initializeApp || (mod.default && mod.default.initializeApp);
    const cert = mod.cert || (mod.default && mod.default.cert);
    
    if (!getApps || !initializeApp || !cert) {
      throw new Error('Impossible d\'extraire les fonctions firebase-admin');
    }
    
    if (getApps().length > 0) {
      adminApp = getApps()[0];
      return adminApp;
    }

    const serviceAccount = parseServiceAccount();
    
    if (!serviceAccount) {
      throw new Error('Configuration Firebase Admin manquante');
    }

    const options = {
      credential: cert(serviceAccount),
      databaseAuthVariableOverride: {
        uid: 'firebase-admin-service'
      },
    };

    const databaseUrl = (process.env.FIREBASE_DATABASE_URL || '').trim();
    if (databaseUrl) {
      options.databaseURL = databaseUrl;
    }

    adminApp = initializeApp(options);
    
    console.log('[firebase-admin] Initialisé avec projectId:', serviceAccount.projectId);
    
    return adminApp;
  } catch (error) {
    initError = error;
    console.error('[firebase-admin] Erreur:', error.message);
    throw error;
  }
}

export async function getAdminAuth() {
  const mod = await loadFirebaseAdmin();
  return mod.getAuth(await getAdminApp());
}

export async function getAdminDatabase() {
  const mod = await loadFirebaseAdmin();
  return mod.getDatabase(await getAdminApp());
}

export async function getAdminFirestore() {
  const mod = await loadFirebaseAdmin();
  return mod.getFirestore(await getAdminApp());
}

export async function getAdminStorage() {
  const mod = await loadFirebaseAdmin();
  return mod.getStorage(await getAdminApp());
}

export function isFirebaseAdminConfigured() {
  return parseServiceAccount() !== null;
}

export function getFirebaseProjectId() {
  const account = parseServiceAccount();
  return account?.projectId || null;
}

// Legacy exports for compatibility
export { getAdminDatabase as getAdminDb };