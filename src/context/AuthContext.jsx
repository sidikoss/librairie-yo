import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { STORAGE_KEYS } from "../config/constants";

const AuthContext = createContext(null);

const AUTH_CONFIG = {
  sessionDuration: 7 * 24 * 60 * 60 * 1000,
  maxInactiveTime: 30 * 60 * 1000,
};

function getStoredUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.user);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveUser(user) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  } catch (error) {
    console.warn("[Auth] Failed to save:", error);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      saveUser(user);
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    window.addEventListener("click", handleActivity);
    window.addEventListener("keypress", handleActivity);

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keypress", handleActivity);
    };
  }, [user]);

  useEffect(() => {
    if (!user || !lastActivity) return;

    const checkInactivity = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > AUTH_CONFIG.maxInactiveTime) {
        console.log("[Auth] Session expired due to inactivity");
      }
    }, 60000);

    return () => clearInterval(checkInactivity);
  }, [user, lastActivity]);

  const register = useCallback(async (userData) => {
    const newUser = {
      id: `user-${Date.now()}`,
      ...userData,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      emailVerified: false,
      phoneVerified: false,
    };

    setUser(newUser);
    return newUser;
  }, []);

  const login = useCallback(async (identifier, password) => {
    const stored = getStoredUser();
    
    if (!stored) {
      throw new Error("Aucun compte trouvé");
    }

    if (stored.password !== password && stored.phone !== password) {
      throw new Error("Mot de passe incorrect");
    }

    const updatedUser = {
      ...stored,
      lastLogin: Date.now(),
    };

    setUser(updatedUser);
    return updatedUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  const updateProfile = useCallback((updates) => {
    setUser((prev) => ({
      ...prev,
      ...updates,
      updatedAt: Date.now(),
    }));
  }, []);

  const verifyEmail = useCallback((code) => {
    if (code === "123456") {
      setUser((prev) => ({
        ...prev,
        emailVerified: true,
        emailVerifiedAt: Date.now(),
      }));
      return true;
    }
    return false;
  }, []);

  const verifyPhone = useCallback((code) => {
    if (code === "123456") {
      setUser((prev) => ({
        ...prev,
        phoneVerified: true,
        phoneVerifiedAt: Date.now(),
      }));
      return true;
    }
    return false;
  }, []);

  const changePassword = useCallback(async (oldPassword, newPassword) => {
    if (user.password !== oldPassword && user.phone !== oldPassword) {
      throw new Error("Mot de passe incorrect");
    }

    setUser((prev) => ({
      ...prev,
      password: newPassword,
      passwordChangedAt: Date.now(),
    }));
  }, [user]);

  const resetPassword = useCallback(async (email) => {
    console.log("[Auth] Password reset requested for:", email);
    return { success: true, message: "Instructions envoyées par email" };
  }, []);

  const deleteAccount = useCallback(async (password) => {
    if (user.password !== password && user.phone !== password) {
      throw new Error("Mot de passe incorrect");
    }

    setUser(null);
    saveUser(null);
  }, [user]);

  const isAuthenticated = useMemo(() => !!user, [user]);
  
  const isVerified = useMemo(
    () => user?.emailVerified || user?.phoneVerified,
    [user]
  );

  const value = {
    user,
    loading,
    isAuthenticated,
    isVerified,
    register,
    login,
    logout,
    updateProfile,
    verifyEmail,
    verifyPhone,
    changePassword,
    resetPassword,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}