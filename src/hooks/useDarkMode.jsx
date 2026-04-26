import { createContext, useContext, useState, useEffect, useCallback, createContext as createContextReact } from "react";

const DarkModeContext = createContextReact(null);

const DARK_MODE_STORAGE_KEY = "yo_dark_mode";

function getStoredDarkMode() {
  try {
    const stored = localStorage.getItem(DARK_MODE_STORAGE_KEY);
    if (stored !== null) {
      return stored === "true";
    }
  } catch {
    // ignore
  }
  
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  
  return false;
}

function updateDOM(isDark) {
  if (typeof document === "undefined") return;
  
  const root = document.documentElement;
  
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", isDark ? "#0e7490" : "#0891b2");
  }
}

export function DarkModeProvider({ children, defaultValue }) {
  const [isDark, setIsDark] = useState(() => {
    if (defaultValue !== undefined) return defaultValue;
    return getStoredDarkMode();
  });

  useEffect(() => {
    updateDOM(isDark);
    
    try {
      localStorage.setItem(DARK_MODE_STORAGE_KEY, String(isDark));
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handler = (e) => {
      if (localStorage.getItem(DARK_MODE_STORAGE_KEY) === null) {
        setIsDark(e.matches);
      }
    };
    
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const toggle = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const setDarkMode = useCallback((value) => {
    setIsDark(value);
  }, []);

  const setLightMode = useCallback(() => {
    setIsDark(false);
  }, []);

  return (
    <DarkModeContext.Provider value={{ isDark, toggle, setDarkMode, setLightMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error("useDarkMode must be used within DarkModeProvider");
  }
  return context;
}

export function DarkModeToggle({ size = "md", className = "" }) {
  const { isDark, toggle } = useDarkMode();

  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <button
      onClick={toggle}
      className={`
        flex items-center justify-center rounded-full
        bg-zinc-100 dark:bg-zinc-800
        text-zinc-600 dark:text-zinc-400
        hover:bg-zinc-200 dark:hover:bg-zinc-700
        transition-colors
        ${sizes[size]}
        ${className}
      `}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      {isDark ? (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}

export default DarkModeProvider;