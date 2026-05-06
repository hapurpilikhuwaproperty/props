"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, authExpiredEvent } from "./api";

type SessionUser = {
  id: number;
  name: string;
  email: string | null;
  phone?: string | null;
  verified?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  sellerVerificationStatus?: string;
  role: string;
};

type AuthState = {
  isAuthed: boolean;
  role: string | null;
  user: SessionUser | null;
  isReady: boolean;
  login: (user: SessionUser) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const normalizeRole = (role: unknown) => (typeof role === "string" ? role.trim().toLowerCase() : null);
const authStorageKey = "props:has-auth-session";

const setAuthMarker = (enabled: boolean) => {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.localStorage.setItem(authStorageKey, "1");
    } else {
      window.localStorage.removeItem(authStorageKey);
    }
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
};

const hasAuthMarker = () => {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(authStorageKey) === "1";
  } catch {
    return false;
  }
};

const shouldCheckSessionOnLoad = () => {
  if (typeof window === "undefined") return false;
  return hasAuthMarker() || window.location.pathname.startsWith("/dashboard");
};

const AuthContext = createContext<AuthState>({
  isAuthed: false,
  role: null,
  user: null,
  isReady: false,
  login: () => {},
  logout: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshSession = async (signal?: AbortSignal) => {
    try {
      const { data } = await api.get("/auth/session", { signal });
      if (signal?.aborted) return;
      setUser(data.user);
      setAuthMarker(true);
    } catch (error: any) {
      if (error?.code === "ERR_CANCELED") return;
      setUser(null);
      setAuthMarker(false);
    } finally {
      if (!signal?.aborted) {
        setIsReady(true);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (!shouldCheckSessionOnLoad()) {
      setIsReady(true);
      return () => controller.abort();
    }

    void refreshSession(controller.signal);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setAuthMarker(false);
      setIsReady(true);
    };

    window.addEventListener(authExpiredEvent, handleAuthExpired);
    return () => window.removeEventListener(authExpiredEvent, handleAuthExpired);
  }, []);

  const value = useMemo(
    () => ({
      isAuthed: !!user,
      role: normalizeRole(user?.role),
      user,
      isReady,
      login: (nextUser: SessionUser) => {
        setUser(nextUser);
        setAuthMarker(true);
        setIsReady(true);
      },
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          setUser(null);
          setAuthMarker(false);
          window.location.href = "/";
        }
      },
      refreshSession,
    }),
    [isReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function canManageProperties(role: string | null) {
  return role === "admin" || role === "seller" || role === "agent";
}
