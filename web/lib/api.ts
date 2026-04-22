"use client";

import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const url = originalRequest?.url || "";
    const isAuthRoute = typeof url === "string" && ["/auth/session", "/auth/refresh", "/auth/logout", "/auth/login", "/auth/register"].some((path) => url.includes(path));

    if (status !== 401 || originalRequest?._retry || !originalRequest || typeof window === "undefined" || isAuthRoute) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = api.post("/auth/refresh").then(() => undefined).finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);
