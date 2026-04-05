import { Navigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

const ProtectedRoute = ({ children, adminOnly = false, staffOrAdmin = false }) => {
  const { isAuthenticated, user, authChecked } = useAuthStore();

  if (!authChecked) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Admin only routes
  if (adminOnly && user?.role !== "ADMIN") {
    // If staff tries to access admin — redirect to their scanner
    if (user?.role === "STAFF") return <Navigate to="/staff/scanner" replace />;
    return <Navigate to="/" replace />;
  }

  // ✅ Staff or Admin routes
  if (staffOrAdmin && user?.role !== "ADMIN" && user?.role !== "STAFF") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;