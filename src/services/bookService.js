import { firebaseApi } from "./firebaseApi";

function mapCollection(data) {
  if (!data || typeof data !== "object") return [];

  return Object.entries(data)
    .filter(([, value]) => value && typeof value === "object")
    .map(([fbKey, value]) => ({
      ...value,
      fbKey,
    }));
}

async function syncBookToLegacyNode(bookId, payload) {
  try {
    await firebaseApi.put(`books/${bookId}`, payload);
  } catch (error) {
    console.warn(`[books-sync] unable to sync books/${bookId}`, error);
  }
}

async function patchBookLegacyNode(bookId, payload) {
  try {
    await firebaseApi.patch(`books/${bookId}`, payload);
  } catch (error) {
    console.warn(`[books-sync] unable to patch books/${bookId}`, error);
  }
}

export async function fetchBooks() {
  const catalogData = await firebaseApi.get("catalog", 9000);
  const catalogBooks = mapCollection(catalogData);
  if (catalogBooks.length > 0) {
    return catalogBooks;
  }

  // Fallback for legacy datasets where catalog is still empty.
  const booksData = await firebaseApi.get("books", 15000);
  const books = mapCollection(booksData);
  if (books.length > 0) {
    return books;
  }

  console.error("[catalog] empty or unavailable: no books found");
  return [];
}

export async function createBook(payload) {
  const result = await firebaseApi.post("catalog", payload);
  const bookId = result?.name || null;
  if (!bookId) return null;

  await syncBookToLegacyNode(bookId, payload);
  return bookId;
}

export async function updateBook(bookId, payload) {
  const result = await firebaseApi.patch(`catalog/${bookId}`, payload);
  await patchBookLegacyNode(bookId, payload);
  return result;
}

export async function deleteBook(bookId) {
  await firebaseApi.del(`catalog/${bookId}`);
  await firebaseApi.del(`books/${bookId}`);
  await firebaseApi.del(`book-files/${bookId}`);
}

export async function uploadBookFile(bookId, filePayload) {
  const result = await firebaseApi.put(`book-files/${bookId}`, filePayload);

  const patchPayload = {
    hasFile: true,
    updatedAt: Date.now(),
  };
  await firebaseApi.patch(`catalog/${bookId}`, patchPayload);
  await patchBookLegacyNode(bookId, patchPayload);

  return result;
}

export async function fetchBookFile(bookId) {
  const fileData = await firebaseApi.get(`book-files/${bookId}`);
  if (fileData?.fileData) return fileData;
  return firebaseApi.get(`books/${bookId}`);
}
