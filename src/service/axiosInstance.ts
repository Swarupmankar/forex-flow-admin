// src/services/axiosInstance.ts
import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { endSession } from "@/lib/session";

const LOGIN_URL = "/broker/auth/login";

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
        endSession("expired");
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

    // A 401 from any API ends the session. Not the login call itself: there a
    // 401 is a wrong password, shown on the form.
    const url: string = error?.config?.url ?? "";
    if (status === 401 && !url.includes(LOGIN_URL)) {
      endSession("unauthorized");
    }

    return Promise.reject(error);
  }
);

export default api;
