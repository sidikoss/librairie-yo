import { describe, expect, it } from "vitest";
import { filterBooks } from "../features/catalog/filterBooks";

const books = [
  {
    title: "Droit des affaires",
    author: "A. Barry",
    category: "Droit",
    price: 45000,
    salesCount: 12,
    createdAt: 10,
  },
  {
    title: "Python Pro",
    author: "M. Diallo",
    category: "Informatique",
    price: 30000,
    salesCount: 30,
    createdAt: 20,
  },
];

describe("filterBooks", () => {
  it("filters by category and query", () => {
    const result = filterBooks(books, "python", "Informatique", "", "", "popular");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Python Pro");
  });

  it("filters by price range", () => {
    const result = filterBooks(books, "", "", 20000, 35000, "price_asc");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Python Pro");
  });
});
