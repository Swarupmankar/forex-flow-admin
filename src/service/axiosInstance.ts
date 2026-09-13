// src/services/axiosInstance.ts
import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && typeof payload.exp === "number") {
      // 5-second buffer to handle latency
      return Date.now() >= payload.exp * 1000 - 5000;
    }
  } catch {
    return false;
  }
  return false;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (isTokenExpired(token)) {
        try {
          localStorage.clear();
        } catch (e) {
          // ignore
        }

        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
        return Promise.reject(new axios.Cancel("Token expired"));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (!(config.data instanceof FormData)) {
      config.headers.set("Content-Type", "application/json");
    } else {
      config.headers.delete("Content-Type");
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // On ANY 401 Unauthorized response from server — force logout client-side.
    if (status === 401) {
      try {
        localStorage.clear();
      } catch (e) {
        // ignore
      }

      // Redirect to login if not already there
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
