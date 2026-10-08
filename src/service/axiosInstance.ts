// src/services/axiosInstance.ts
import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * Session model, shared with the backend's token.service:
 *
 *  - the ACCESS token lives JWT_ACCESS_EXPIRATION_MINUTES (30 minutes) and goes
 *    on every request;
 *  - the REFRESH token lives JWT_REFRESH_EXPIRATION_DAYS (24 hours) from LOGIN.
 *    Refreshing hands back a new pair, but the new refresh token keeps the old
 *    one's expiry - it does not restart the day.
 *
 * So this client refreshes the access token silently for a day and then, when
 * /broker/auth/refresh-tokens refuses, signs the broker out. An expired access
 * token on its own is never a reason to log out.
 */
export const ACCESS_TOKEN_KEY = "token";
export const REFRESH_TOKEN_KEY = "refreshToken";

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

/** True while the refresh token can still be redeemed, i.e. within the 24 hours. */
export const hasLiveSession = (): boolean => {
  try {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return !!refreshToken && !isTokenExpired(refreshToken);
  } catch {
    return false;
  }
};

export const storeTokens = (tokens: {
  access?: { token?: string };
  refresh?: { token?: string };
}) => {
  if (tokens?.access?.token) localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access.token);
  if (tokens?.refresh?.token) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh.token);
};

const clearSession = () => {
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
};

const redirectToLogin = () => {
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const endSession = () => {
  clearSession();
  redirectToLogin();
};

// A bare client with no interceptors, so a refresh can never trigger another
// refresh, and a refused refresh is not mistaken for a request to retry.
const bare = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

let refreshing: Promise<string | null> | null = null;

/**
 * Exchanges the refresh token for a new pair and stores both. Resolves to the
 * new access token, or null once the session is over (no refresh token, an
 * expired one, or the backend refusing it). One flight at a time: several 401s
 * arriving together share the same refresh instead of racing, which matters
 * because the backend deletes a refresh token the moment it is redeemed.
 */
export const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

const doRefresh = async (): Promise<string | null> => {
  let refreshToken: string | null = null;
  try {
    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
  if (!refreshToken || isTokenExpired(refreshToken)) return null;
  try {
    const { data } = await bare.post("/broker/auth/refresh-tokens", { refreshToken });
    if (!data?.access?.token) return null;
    storeTokens(data);
    return data.access.token as string;
  } catch {
    return null;
  }
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Request interceptor: an access token that has already run out is refreshed
// BEFORE the request goes, so the usual case costs one round trip, not three.
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    let token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && isTokenExpired(token)) {
      token = await refreshAccessToken();
      if (!token) {
        endSession();
        return Promise.reject(new axios.Cancel("Session expired"));
      }
    }
    if (token) {
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

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

// Response interceptor: a 401 the clock did not predict (the backend's view of
// expiry wins, or the broker was disabled) gets one refresh-and-retry. If that
// fails too, the session is over.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error?.response?.status;
    if (status !== 401) return Promise.reject(error);

    const original = error.config as RetriableConfig | undefined;
    const url = original?.url ?? "";

    // A wrong password is not a dead session.
    if (url.includes("/broker/auth/login")) return Promise.reject(error);

    if (original && !original._retried) {
      const token = await refreshAccessToken();
      if (token) {
        original._retried = true;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }

    endSession();
    return Promise.reject(error);
  }
);

export default api;
