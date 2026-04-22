"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "./api";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  verified?: boolean;
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
    } catch (error: any) {
      if (error?.code === "ERR_CANCELED") return;
      setUser(null);
    } finally {
      if (!signal?.aborted) {
        setIsReady(true);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void refreshSession(controller.signal);
    return () => controller.abort();
  }, []);

  const value = useMemo(
    () => ({
      isAuthed: !!user,
      role: normalizeRole(user?.role),
      user,
      isReady,
      login: (nextUser: SessionUser) => {
        setUser(nextUser);
        setIsReady(true);
      },
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          setUser(null);
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
  return role === "admin" || role === "agent";
}
