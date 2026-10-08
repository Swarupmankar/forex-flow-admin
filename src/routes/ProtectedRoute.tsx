import { Navigate, Outlet } from "react-router-dom";
import { hasLiveSession } from "@/service/axiosInstance";

// Gates on the REFRESH token, not the access token: an access token that ran
// out mid-session is renewed by the axios instance on the next request, and
// the broker is only sent back to login once the 24-hour session is over.
const ProtectedRoute = () => {
  if (!hasLiveSession()) {
    try {
      localStorage.clear();
    } catch (e) {
      // ignore
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
