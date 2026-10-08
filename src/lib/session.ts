// Ending the admin session from anywhere: an expired JWT, a 401 from any API,
// or a logout in another tab. The login page reads the reason and says why.

export type SessionEndReason = "expired" | "unauthorized";

const REASON_KEY = "session-ended";

/** Milliseconds until the JWT's `exp`, or null when it has none or cannot be read. */
export const msUntilExpiry = (token: string | null): number | null => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp * 1000 - Date.now() : null;
  } catch {
    return null;
  }
};

let ending = false;

/**
 * Clears the stored login and goes to the login screen. A full page load, not
 * a router push, so no cached API data or Redux state outlives the session.
 * Safe to call many times: a burst of 401s redirects once.
 */
export const endSession = (reason: SessionEndReason) => {
  if (ending) return;
  ending = true;
  try {
    localStorage.clear();
    sessionStorage.setItem(REASON_KEY, reason);
  } catch {
    // storage blocked: the redirect still ends the session
  }
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.replace("/login");
  } else {
    ending = false;
  }
};

/** Why the last session ended, read once by the login page. */
export const takeSessionEndReason = (): SessionEndReason | null => {
  try {
    const reason = sessionStorage.getItem(REASON_KEY) as SessionEndReason | null;
    sessionStorage.removeItem(REASON_KEY);
    return reason;
  } catch {
    return null;
  }
};
