import { Navigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, authChecked } = useAuthStore();

  // Wait for /users/me to finish before making any redirect decision
  if (!authChecked) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;