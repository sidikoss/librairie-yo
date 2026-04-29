import { useMemo, useState } from "react";
import { filterBooks } from "./filterBooks";

export function useCatalogFilters(books = []) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("popular");

  const filteredBooks = useMemo(
    () => filterBooks(books, query, category, minPrice, maxPrice, sortBy),
    [books, query, category, minPrice, maxPrice, sortBy],
  );

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
