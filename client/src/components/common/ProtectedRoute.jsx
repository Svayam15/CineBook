import { Navigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

   // Wait for user data to load
  if (adminOnly && !user) {
    return null; // ← wait, don't redirect yet
  }

  if (adminOnly && user?.role !== "ADMIN") {
    return <Navigate to="/" />;
  }

  return children;
};

export default ProtectedRoute;