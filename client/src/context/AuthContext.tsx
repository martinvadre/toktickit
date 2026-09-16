import React, { createContext, useContext, useState, useEffect } from "react";
import {
  AuthUser,
  getAuthToken,
  setAuthToken,
  loginUser,
  logoutUser,
  fetchCurrentUser,
  changeUserPassword,
} from "../api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (
    current: string,
    next: string,
    confirm: string
  ) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "toktickit_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [user, setUserState] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(USER_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and verify user on mount if token exists
  useEffect(() => {
    async function initAuth() {
      const existingToken = getAuthToken();
      if (existingToken) {
        try {
          const currentUser = await fetchCurrentUser();
          setUserState(currentUser);
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem(
              USER_STORAGE_KEY,
              JSON.stringify(currentUser)
            );
          }
        } catch (err) {
          // Token expired or invalid
          setAuthToken(null);
          setTokenState(null);
          setUserState(null);
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.removeItem(USER_STORAGE_KEY);
          }
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser> => {
    setError(null);
    try {
      const data = await loginUser(email, password);
      setTokenState(data.token);
      setUserState(data.user);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(data.user)
        );
      }
      return data.user;
    } catch (err: any) {
      const msg = err.message || "Authentication failed";
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      // Ignore network errors during logout
    } finally {
      setAuthToken(null);
      setTokenState(null);
      setUserState(null);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  };

  const changePassword = async (
    current: string,
    next: string,
    confirm: string
  ) => {
    setError(null);
    try {
      const result = await changeUserPassword(current, next, confirm);
      const updatedUser = { ...user!, ...result.user, mustChangePassword: false };
      setUserState(updatedUser);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(updatedUser)
        );
      }
    } catch (err: any) {
      const msg = err.message || "Failed to change password";
      setError(msg);
      throw new Error(msg);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        changePassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
