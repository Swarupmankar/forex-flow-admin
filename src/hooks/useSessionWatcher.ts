import { useEffect } from "react";
import { endSession, msUntilExpiry } from "@/lib/session";

// setTimeout overflows past ~24.8 days; longer tokens are rechecked then.
const MAX_TIMER_MS = 2_147_483_647;

/**
 * Logs out when the JWT expires even if the page makes no request, and when
 * another tab logs out. Timers do not run while a laptop sleeps, so the token
 * is checked again whenever the tab comes back.
 */
export const useSessionWatcher = () => {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      clearTimeout(timer);
      const token = localStorage.getItem("token");
      if (!token) {
        endSession("unauthorized");
        return;
      }
      const left = msUntilExpiry(token);
      if (left === null) return;
      if (left <= 0) {
        endSession("expired");
        return;
      }
      timer = setTimeout(check, Math.min(left, MAX_TIMER_MS));
    };

    // Another tab logged out (or logged in as someone else).
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === "token") check();
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
