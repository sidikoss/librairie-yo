import { firebaseApi } from "./firebaseApi";

export async function fetchBooks() {
  const data = await firebaseApi.get("books", 9000);

  if (!data || typeof data !== "object") {
    console.log("FIREBASE EMPTY OR INVALID:", data);
    return [];
  }

  return Object.entries(data).map(([fbKey, value]) => ({
    ...value,
    fbKey,
  }));
}

export async function createBook(payload) {
  const result = await firebaseApi.post("books", payload);
  return result?.name || null;
}

export async function updateBook(bookId, payload) {
  return firebaseApi.patch(`books/${bookId}`, payload);
}

export async function deleteBook(bookId) {
  await firebaseApi.del(`books/${bookId}`);
  await firebaseApi.del(`book-files/${bookId}`);
}

export async function uploadBookFile(bookId, filePayload) {
  return firebaseApi.put(`book-files/${bookId}`, filePayload);
}

export async function fetchBookFile(bookId) {
  const fileData = await firebaseApi.get(`book-files/${bookId}`);
  if (fileData?.fileData) return fileData;
  return firebaseApi.get(`books/${bookId}`);
}
