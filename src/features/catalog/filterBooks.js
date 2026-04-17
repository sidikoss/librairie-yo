export function filterBooks(books, query, category, minPrice, maxPrice, sortBy) {
  const normalizedQuery = String(query || "").trim().toLowerCase();

  const filtered = books.filter((book) => {
    const matchesQuery =
      !normalizedQuery ||
      String(book.title).toLowerCase().includes(normalizedQuery) ||
      String(book.author).toLowerCase().includes(normalizedQuery);

    const matchesCategory = !category || book.category === category;
    const price = Number(book.price || 0);
    const matchesMin = minPrice === "" || price >= Number(minPrice);
    const matchesMax = maxPrice === "" || price <= Number(maxPrice);

    return matchesQuery && matchesCategory && matchesMin && matchesMax;
  });

  if (sortBy === "price_asc") {
    return filtered.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  }

  if (sortBy === "price_desc") {
    return filtered.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  }

  if (sortBy === "popular") {
    return filtered.sort(
      (a, b) => Number(b.salesCount || 0) - Number(a.salesCount || 0),
    );
  }

  return filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
