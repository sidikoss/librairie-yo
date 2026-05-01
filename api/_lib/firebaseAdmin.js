import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

let app = null;

function getServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json);
      let privateKey = parsed.private_key;
      if (privateKey && !privateKey.includes("\n") && privateKey.includes("\\n")) {
        privateKey = privateKey.replace(/\\n/g, "\n");
      }
      if (!privateKey || !privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
        return null;
      }
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey,
      };
    } catch {
      return null;
    }
  }

  if (process.env.FIREBASE_PROJECT_ID) {
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";
    if (privateKey && !privateKey.includes("\n") && privateKey.includes("\\n")) {
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    if (!privateKey || !privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      return null;
    }

    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
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
    throw new Error("Firebase Admin: service account manquant ou invalide");
  }

  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  return app;
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
  return getServiceAccount() !== null;
}
