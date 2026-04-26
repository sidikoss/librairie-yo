import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "../config/constants";

const ReviewsContext = createContext(null);

const DEFAULT_REVIEWS = {
  "book-1": [
    {
      id: "r1",
      bookId: "book-1",
      userId: "user-1",
      userName: "Aliou D.",
      rating: 5,
      title: "Excellent roman!",
      comment: "Une histoire captivante que je recommande fortement. L'écriture est fluide et les personnages sont attachants.",
      verified: true,
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      helpful: 12,
      response: null,
    },
    {
      id: "r2",
      bookId: "book-1",
      userId: "user-2",
      userName: "Mariame T.",
      rating: 4,
      title: "Bon livre",
      comment: "Histoire intéressante, mais la fin m'a laissé sur ma faim. Sinon, je recommande.",
      verified: true,
      createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      helpful: 5,
      response: null,
    },
  ],
};

function getStoredReviews() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.reviews);
    return stored ? JSON.parse(stored) : DEFAULT_REVIEWS;
  } catch {
    return DEFAULT_REVIEWS;
  }
}

function saveReviews(reviews) {
  try {
    localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
  } catch (error) {
    console.warn("[Reviews] Failed to save:", error);
  }
}

export function ReviewsProvider({ children }) {
  const [reviews, setReviews] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setReviews(getStoredReviews());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveReviews(reviews);
    }
  }, [reviews, loading]);

  const getReviewsForBook = useCallback(
    (bookId) => {
      return reviews[bookId] || [];
    },
    [reviews]
  );

  const getAverageRating = useCallback(
    (bookId) => {
      const bookReviews = reviews[bookId] || [];
      if (bookReviews.length === 0) return null;
      const sum = bookReviews.reduce((acc, r) => acc + r.rating, 0);
      return sum / bookReviews.length;
    },
    [reviews]
  );

  const getRatingDistribution = useCallback(
    (bookId) => {
      const bookReviews = reviews[bookId] || [];
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      bookReviews.forEach((r) => {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      });
      return distribution;
    },
    [reviews]
  );

  const addReview = useCallback(
    (review) => {
      const newReview = {
        id: `r${Date.now()}`,
        createdAt: Date.now(),
        helpful: 0,
        response: null,
        ...review,
      };

      setReviews((prev) => ({
        ...prev,
        [review.bookId]: [...(prev[review.bookId] || []), newReview],
      }));

      return newReview;
    },
    []
  );

  const updateReview = useCallback((bookId, reviewId, updates) => {
    setReviews((prev) => ({
      ...prev,
      [bookId]: prev[bookId].map((r) =>
        r.id === reviewId ? { ...r, ...updates } : r
      ),
    }));
  }, []);

  const deleteReview = useCallback((bookId, reviewId) => {
    setReviews((prev) => ({
      ...prev,
      [bookId]: prev[bookId].filter((r) => r.id !== reviewId),
    }));
  }, []);

  const markHelpful = useCallback((bookId, reviewId) => {
    setReviews((prev) => ({
      ...prev,
      [bookId]: prev[bookId].map((r) =>
        r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r
      ),
    }));
  }, []);

  const getTotalReviews = useMemo(() => {
    return Object.values(reviews).flat().length;
  }, [reviews]);

  const getTotalRatings = useMemo(() => {
    const allReviews = Object.values(reviews).flat();
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    return allReviews.length > 0 ? sum / allReviews.length : null;
  }, [reviews]);

  const value = {
    reviews,
    loading,
    getReviewsForBook,
    getAverageRating,
    getRatingDistribution,
    addReview,
    updateReview,
    deleteReview,
    markHelpful,
    totalReviews: getTotalReviews,
    averageRating: getTotalRatings,
  };

  return (
    <ReviewsContext.Provider value={value}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewsContext);
  if (!context) {
    throw new Error("useReviews must be used within ReviewsProvider");
  }
  return context;
}