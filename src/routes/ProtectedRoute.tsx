import { Navigate, Outlet } from "react-router-dom";
import { hasLiveSession } from "@/service/axiosInstance";
import { endSession } from "@/lib/session";
import { useSessionWatcher } from "@/hooks/useSessionWatcher";

// Gates on the REFRESH token, not the access token: an access token that ran
// out mid-session is renewed by the axios instance on the next request, and
// the broker is only sent back to login once the 24-hour session is over.
const ProtectedRoute = () => {
  if (!hasLiveSession()) {
    const hadSession = !!localStorage.getItem("token");
    if (hadSession) {
      // The session ran out while they were away: say so on the login page.
      endSession("expired");
      return null;
    }
    return <Navigate to="/login" replace />;
  }

  return <WatchedOutlet />;
};

/** Every protected page runs the session-end and other-tab watcher. */
const WatchedOutlet = () => {
  useSessionWatcher();
  return <Outlet />;
};

export default ProtectedRoute;
