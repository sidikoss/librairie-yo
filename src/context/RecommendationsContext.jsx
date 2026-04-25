import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "../config/constants";

const RecommendationsContext = createContext(null);

function getStoredHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.viewHistory);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEYS.viewHistory, JSON.stringify(history.slice(0, 50)));
  } catch (error) {
    console.warn("[Recommendations] Failed to save:", error);
  }
}

export function RecommendationsProvider({ children }) {
  const [viewHistory, setViewHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setViewHistory(getStoredHistory());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      saveHistory(viewHistory);
    }
  }, [viewHistory, loading]);

  const trackView = useCallback((book) => {
    setViewHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== book.id);
      return [
        { ...book, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, 50);
    });
  }, []);

  const getRecentlyViewed = useCallback((limit = 10) => {
    return viewHistory.slice(0, limit);
  }, [viewHistory]);

  const getViewedCategories = useMemo(() => {
    const categories = viewHistory.map((b) => b.category).filter(Boolean);
    return [...new Set(categories)];
  }, [viewHistory]);

  const getViewedAuthors = useMemo(() => {
    const authors = viewHistory.map((b) => b.author).filter(Boolean);
    return [...new Set(authors)];
  }, [viewHistory]);

  const clearHistory = useCallback(() => {
    setViewHistory([]);
  }, []);

  const value = {
    viewHistory,
    loading,
    trackView,
    getRecentlyViewed,
    getViewedCategories,
    getViewedAuthors,
    clearHistory,
  };

  return (
    <RecommendationsContext.Provider value={value}>
      {children}
    </RecommendationsContext.Provider>
  );
}

export function useRecommendations() {
  const context = useContext(RecommendationsContext);
  if (!context) {
    throw new Error("useRecommendations must be used within RecommendationsProvider");
  }
  return context;
}