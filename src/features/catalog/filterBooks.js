function toNumber(value, fallback = null) {
  if (value === "" || value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sortBooks(list, sortBy) {
  const books = [...list];

  switch (sortBy) {
    case "price_asc":
      books.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
      break;
    case "price_desc":
      books.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
      break;
    case "newest":
      books.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
      break;
    case "popular":
    default:
      books.sort((a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0));
      break;
  }

  return books;
}

export function filterBooks(
  books = [],
  query = "",
  category = "",
  minPrice = "",
  maxPrice = "",
  sortBy = "popular",
) {
  const q = String(query || "").trim().toLowerCase();
  const selectedCategory = String(category || "").trim();
  const min = toNumber(minPrice);
  const max = toNumber(maxPrice);

  const filtered = (Array.isArray(books) ? books : []).filter((book) => {
    if (!book) return false;

    if (selectedCategory && book.category !== selectedCategory) {
      return false;
    }

    if (q) {
      const haystack = `${book.title || ""} ${book.author || ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    const price = Number(book.price || 0);
    if (min != null && price < min) return false;
    if (max != null && price > max) return false;

    return true;
  });

  return sortBooks(filtered, sortBy);
}
