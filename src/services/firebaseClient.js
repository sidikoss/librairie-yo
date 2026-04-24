import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const requiredConfigKeys = ["apiKey", "authDomain", "projectId", "appId"];

function hasMissingConfig() {
  return requiredConfigKeys.some((key) => !String(firebaseConfig[key] || "").trim());
}

export function isFirebaseReaderConfigured() {
  return !hasMissingConfig();
}

function getFirebaseApp() {
  if (hasMissingConfig()) {
    throw new Error(
      "Configuration Firebase manquante (VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID).",
    );
  }

  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(firebaseConfig);
}

export async function ensureReaderSession() {
  const app = getFirebaseApp();
  const auth = getAuth(app);

  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }

  if (!auth.currentUser) {
    throw new Error("Session lecteur introuvable.");
  }

  const token = await auth.currentUser.getIdToken();
  return {
    uid: auth.currentUser.uid,
    token,
  };
}
