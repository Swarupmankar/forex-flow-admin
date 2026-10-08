import { useEffect } from "react";
import { endSession, msUntilExpiry } from "@/lib/session";
import { REFRESH_TOKEN_KEY } from "@/service/axiosInstance";

// setTimeout overflows past ~24.8 days; longer tokens are rechecked then.
const MAX_TIMER_MS = 2_147_483_647;

/**
 * Logs out when the SESSION ends even if the page makes no request, and when
 * another tab logs out. The session is the refresh token: it lives 24 hours
 * from login and a refresh does not extend it. The access token is not watched
 * - it runs out every 30 minutes and the axios instance renews it silently.
 * Timers do not run while a laptop sleeps, so the token is checked again
 * whenever the tab comes back.
 */
export const useSessionWatcher = () => {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      clearTimeout(timer);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        endSession("unauthorized");
        return;
      }
      const left = msUntilExpiry(refreshToken);
      if (left === null) return;
      if (left <= 0) {
        endSession("expired");
        return;
      }
      timer = setTimeout(check, Math.min(left, MAX_TIMER_MS));
    };

    // Another tab logged out (or logged in as someone else). A rotation by
    // another tab also lands here and just reschedules the timer.
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === REFRESH_TOKEN_KEY) check();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    check();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
};
