import { Navigate, Outlet } from "react-router-dom";
import { isTokenExpired } from "@/service/axiosInstance";
import { endSession } from "@/lib/session";
import { useSessionWatcher } from "@/hooks/useSessionWatcher";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;
  if (isTokenExpired(token)) {
    endSession("expired");
    return null;
  }

  return <WatchedOutlet />;
};

/** Every protected page runs the expiry and other-tab watcher. */
const WatchedOutlet = () => {
  useSessionWatcher();
  return <Outlet />;
};

export default ProtectedRoute;
