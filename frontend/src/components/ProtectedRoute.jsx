import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("accessToken");

  // If not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // User exists → allow access
  return <Outlet />;
};

export default ProtectedRoute;
