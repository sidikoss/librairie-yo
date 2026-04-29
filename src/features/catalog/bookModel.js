/**
 * Normalize book data from Firebase
 * @param {Object} rawBook - Raw book data from Firebase
 * @param {number} salesCount - Number of sales
 * @returns {Object} Normalized book object
 */
export function normalizeBook(rawBook, salesCount = 0) {
  if (!rawBook) return null;
  
  return {
    id: rawBook.id || rawBook.fbKey || '',
    fbKey: rawBook.fbKey || '',
    title: rawBook.title || '',
    author: rawBook.author || '',
    pages: Number(rawBook.pages) || 0,
    category: rawBook.category || '',
    image: rawBook.image || '',
    description: rawBook.description || '',
    rating: Number(rawBook.rating) || 0,
    price: Number(rawBook.price) || 0,
    discount: Number(rawBook.discount) || 0,
    stock: Number(rawBook.stock) || 0,
    featured: Boolean(rawBook.featured),
    isNew: Boolean(rawBook.isNew),
    createdAt: rawBook.createdAt || Date.now(),
    fileId: rawBook.fileId || '',
    salesCount: salesCount,
  };
}

/**
 * Serialize book data for Firebase
 * @param {Object} draft - Book draft data
 * @param {Object} currentBook - Current book data (optional)
 * @returns {Object} Firebase-ready book object
 */
export function serializeBookToFirebase(draft, currentBook = null) {
  return {
    title: String(draft.title || ''),
    author: String(draft.author || ''),
    pages: Number(draft.pages) || 0,
    category: String(draft.category || ''),
    image: String(draft.image || ''),
    description: String(draft.description || ''),
    rating: Number(draft.rating) || 0,
    price: Number(draft.price) || 0,
    discount: Number(draft.discount) || 0,
    stock: Number(draft.stock) || 0,
    featured: Boolean(draft.featured),
    isNew: Boolean(draft.isNew),
    createdAt: currentBook?.createdAt || Date.now(),
    fileId: currentBook?.fileId || '',
  };
}
