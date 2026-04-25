import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "placeholder",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "placeholder.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "placeholder",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "placeholder.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "placeholder",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "placeholder",
};

let app = null;
let db = null;
let auth = null;
let storage = null;

export function initializeFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  }
  return { app, db, auth, storage };
}

export async function addBook(bookData) {
  const { db } = initializeFirebase();
  const docRef = await addDoc(collection(db, "books"), {
    ...bookData,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getBooks(filters = {}) {
  const { db } = initializeFirebase();
  let q = collection(db, "books");

  const constraints = [];
  if (filters.category) {
    constraints.push(where("category", "==", filters.category));
  }
  if (filters.limit) {
    constraints.push(limit(filters.limit));
  }

  const querySnapshot = await getDocs(query(q, ...constraints));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function updateBook(bookId, bookData) {
  const { db } = initializeFirebase();
  const bookRef = doc(db, "books", bookId);
  await updateDoc(bookRef, {
    ...bookData,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBook(bookId) {
  const { db } = initializeFirebase();
  const bookRef = doc(db, "books", bookId);
  await deleteDoc(bookRef);
}

export async function createOrder(orderData) {
  const { db } = initializeFirebase();
  const docRef = await addDoc(collection(db, "orders"), {
    ...orderData,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getOrders(customerId) {
  const { db } = initializeFirebase();
  const q = query(collection(db, "orders"), where("customerId", "==", customerId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function updateOrderStatus(orderId, status) {
  const { db } = initializeFirebase();
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, { status, updatedAt: new Date().toISOString() });
}

export async function uploadFile(file, path) {
  const { storage } = initializeFirebase();
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export { initializeFirebase as default };

export default {
  initializeFirebase,
  addBook,
  getBooks,
  updateBook,
  deleteBook,
  createOrder,
  getOrders,
  updateOrderStatus,
  uploadFile,
};