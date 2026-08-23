import React, { createContext, useContext, useState, useEffect } from "react";
import { RequesterUser, fetchRequesters } from "../api";

interface RequesterContextType {
  currentRequester: RequesterUser | null;
  requesters: RequesterUser[];
  loading: boolean;
  error: string | null;
  setRequester: (requester: RequesterUser) => void;
  clearRequester: () => void;
  reloadRequesters: () => Promise<void>;
}

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

const STORAGE_KEY = "toktickit_current_requester";

export const RequesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRequester, setCurrentRequesterState] = useState<RequesterUser | null>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [requesters, setRequesters] = useState<RequesterUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRequesters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRequesters();
      setRequesters(data);
    } catch (err: any) {
      setError(err.message || "Failed to load development requesters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequesters();
  }, []);

  const setRequester = (requester: RequesterUser) => {
    setCurrentRequesterState(requester);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requester));
      } catch (e) {
        console.error("Failed to save requester to localStorage", e);
      }
    }
  };

  const clearRequester = () => {
    setCurrentRequesterState(null);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error("Failed to remove requester from localStorage", e);
      }
    }
  };

  return (
    <RequesterContext.Provider
      value={{
        currentRequester,
        requesters,
        loading,
        error,
        setRequester,
        clearRequester,
        reloadRequesters: loadRequesters,
      }}
    >
      {children}
    </RequesterContext.Provider>
  );
};

export function useRequester(): RequesterContextType {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
}
