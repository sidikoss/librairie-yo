// api/_lib/firebaseAdmin.js
// Configuration Firebase Admin avec sécurité renforcée
// Gère l'initialisation sécurisée du SDK Firebase côté serveur

import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const VALIDATION_ERRORS = [];

function normalizePrivateKey(value) {
  if (!value || typeof value !== 'string') {
    console.log('[firebase-admin] normalizePrivateKey: value is null/undefined or not a string');
    return null;
  }
  const normalized = value.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
  if (!normalized.includes('-----BEGIN PRIVATE KEY-----')) {
    console.log('[firebase-admin] normalizePrivateKey: missing BEGIN PRIVATE KEY, value starts with:', value.substring(0, 50));
    VALIDATION_ERRORS.push('Firebase private key format invalide');
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
  const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
  const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
  const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;
  
  console.log('[firebase-admin] PROJECT_ID:', PROJECT_ID ? PROJECT_ID.substring(0, 20) : 'undefined');
  console.log('[firebase-admin] CLIENT_EMAIL:', CLIENT_EMAIL || 'undefined');
  console.log('[firebase-admin] PRIVATE_KEY length:', PRIVATE_KEY ? PRIVATE_KEY.length : 'undefined');
  
  const envAccount = {
    projectId: PROJECT_ID,
    clientEmail: CLIENT_EMAIL,
    privateKey: normalizePrivateKey(PRIVATE_KEY),
  };

  if (envAccount.projectId && envAccount.clientEmail && envAccount.privateKey) {
    console.log('[firebase-admin] Config OK, validating');
    return validateServiceAccount(envAccount);
  }

  console.warn('[firebase-admin] Aucune configuration Firebase Admin');
  return null;
}

let adminApp = null;
let initError = null;

function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }
  
  if (initError) {
    throw initError;
  }
  
  try {
    if (getApps().length > 0) {
      adminApp = getApps()[0];
      return adminApp;
    }

    const serviceAccount = parseServiceAccount();
    
    if (!serviceAccount) {
      throw new Error(
        'Configuration Firebase Admin manquante. ' +
        'Définissez FIREBASE_SERVICE_ACCOUNT_JSON ou ' +
        '(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)'
      );
    }

    const options = {
      credential: cert(serviceAccount),
      databaseAuthVariableOverride: {
        uid: 'firebase-admin-service'
      },
    };

    const databaseUrl = process.env.FIREBASE_DATABASE_URL || process.env.FIREBASE_DB_URL;
    if (databaseUrl) {
      if (!databaseUrl.startsWith('https://') && !databaseUrl.startsWith('http://')) {
        throw new Error('FIREBASE_DATABASE_URL doit commencer par https://');
      }
      console.log('[firebase-admin] Using DATABASE_URL:', databaseUrl.substring(0, 30));
      options.databaseURL = databaseUrl;
    }

    if (process.env.FIREBASE_STORAGE_BUCKET) {
      if (!process.env.FIREBASE_STORAGE_BUCKET.includes('.appspot.com')) {
        console.warn('[firebase-admin] FIREBASE_STORAGE_BUCKET pourrait être invalide');
      }
      options.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    }

    adminApp = initializeApp(options);
    
    console.log('[firebase-admin] Initialisé avec projectId:', serviceAccount.projectId);
    
    return adminApp;
  } catch (error) {
    initError = error;
    console.error('[firebase-admin] Erreur d\'initialisation:', error.message);
    throw error;
  }
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDatabase() {
  return getDatabase(getAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}

export function isFirebaseAdminConfigured() {
  return parseServiceAccount() !== null;
}

export function getFirebaseProjectId() {
  const account = parseServiceAccount();
  return account?.projectId || null;
}