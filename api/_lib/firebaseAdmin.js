import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function normalizePrivateKey(value) {
  return String(value || "").replace(/\\n/g, "\n");
}

function parseServiceAccount() {
  const jsonValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonValue) {
    try {
      const parsed = JSON.parse(jsonValue) || {};
      const normalized = {
        projectId: parsed.projectId || parsed.project_id || process.env.FIREBASE_PROJECT_ID,
        clientEmail:
          parsed.clientEmail || parsed.client_email || process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: normalizePrivateKey(
          parsed.privateKey || parsed.private_key || process.env.FIREBASE_PRIVATE_KEY,
        ),
      };
      if (normalized.projectId && normalized.clientEmail && normalized.privateKey) {
        return normalized;
      }
    } catch (error) {
      console.error("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON invalide:", error);
    }
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount = parseServiceAccount();
  const options = {
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
  };

  const databaseUrl = process.env.FIREBASE_DATABASE_URL || process.env.FIREBASE_DB_URL;
  if (databaseUrl) {
    options.databaseURL = databaseUrl;
  }

  if (process.env.FIREBASE_STORAGE_BUCKET) {
    options.storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
  }

  return initializeApp(options);
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
