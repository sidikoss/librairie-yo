import { useState, useMemo } from "react";

export function useCatalogFilters(books) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  const filteredBooks = useMemo(() => {
    if (!Array.isArray(books)) return [];

    let result = [...books];

    // Filter by search query
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(book =>
        book.title?.toLowerCase().includes(q) ||
        book.author?.toLowerCase().includes(q)
      );
    }

    // Filter by category
    if (category) {
      result = result.filter(book => book.category === category);
    }

    // Filter by price range
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || Infinity;
    result = result.filter(book => {
      const price = Number(book.price) || 0;
      return price >= min && price <= max;
    });

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
        result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
      case 'popular':
      default:
        result.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
        break;
    }

    return result;
  }, [books, query, category, minPrice, maxPrice, sortBy]);

  return {
    query,
    category,
    minPrice,
    maxPrice,
    sortBy,
    setQuery,
    setCategory,
    setMinPrice,
    setMaxPrice,
    setSortBy,
    filteredBooks,
  };
}
