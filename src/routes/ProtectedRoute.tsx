import { Navigate, Outlet } from "react-router-dom";
import { isTokenExpired } from "@/service/axiosInstance";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");
  const expired = isTokenExpired(token);

  if (!token || expired) {
    if (expired && token) {
      try {
        localStorage.clear();
      } catch (e) {
        // ignore
      }
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
