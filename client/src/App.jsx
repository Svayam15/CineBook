import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";
import api from "./api/axios";
import AdminProfile from "./pages/admin/AdminProfile";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import OTPVerify from "./pages/OTPVerify";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// User pages
import Home from "./pages/user/Home";
import LandingPage from "./pages/LandingPage";
import ShowDetails from "./pages/user/ShowDetails.jsx";
import MovieDetails from "./pages/user/MovieDetails.jsx";
import Payment from "./pages/user/Payment";
import MyBookings from "./pages/user/MyBookings";
import BookingConfirm from "./pages/user/BookingConfirm";
import Profile from "./pages/user/Profile";
import Terms from "./pages/user/Terms";
import Privacy from "./pages/user/Privacy";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Movies from "./pages/admin/Movies";
import Theatres from "./pages/admin/Theatres";
import Shows from "./pages/admin/Shows";
import Bookings from "./pages/admin/Bookings";
import Users from "./pages/admin/Users";
import WindowBooking from "./pages/admin/WindowBooking";
import Scanner from "./pages/admin/Scanner";

// Staff pages
import StaffScanner from "./pages/staff/StaffScanner";
import StaffProfile from "./pages/staff/StaffProfile";

// Components
import ProtectedRoute from "./components/common/ProtectedRoute";

function App() {
  const { isAuthenticated, user, authChecked, setUser, clearAuth, setAuthChecked } =
    useAuthStore();

  // ── On every mount, verify the httpOnly cookie with the server.
  //    This is the ONLY place that decides if the user is logged in.
  //    It runs before any route renders (blocked by !authChecked gate below).
  useEffect(() => {
    // Clean up any leftover persisted state from the old persist-based store
    localStorage.removeItem("auth-storage");

    const verifyAuth = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch {
        // Cookie missing, expired, or invalid — treat as logged out
        clearAuth();
      } finally {
        setAuthChecked();
      }
    };

    verifyAuth().catch(console.error);
  }, [setUser, clearAuth, setAuthChecked]);

  // ── Block ALL route rendering until the server auth check resolves.
  //    This prevents the landing page from flashing before redirect,
  //    AND prevents Home from flashing before the landing page.
  if (!authChecked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f6f6f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "12px",
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        <svg
          style={{ animation: "spin 0.8s linear infinite", width: 28, height: 28, color: "#7C3AED" }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p style={{ color: "#aaa", fontSize: "13px", fontWeight: 500 }}>Loading CineBook...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<OTPVerify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      {/* Root — landing for guests, redirect for authenticated users */}
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <LandingPage />
          ) : user?.role === "ADMIN" ? (
            <Navigate to="/admin" replace />
          ) : user?.role === "STAFF" ? (
            <Navigate to="/staff/scanner" replace />
          ) : (
            <Home />
          )
        }
      />

      {/* Public content routes */}
      <Route path="/shows/:id" element={<ShowDetails />} />
      <Route path="/movies/:id" element={<MovieDetails />} />

      {/* Protected user routes */}
      <Route path="/payment"        element={<ProtectedRoute><Payment /></ProtectedRoute>} />
      <Route path="/my-bookings"    element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
      <Route path="/booking-confirm" element={<ProtectedRoute><BookingConfirm /></ProtectedRoute>} />

      {/* Staff routes */}
      <Route path="/staff/scanner" element={<ProtectedRoute staffOrAdmin><StaffScanner /></ProtectedRoute>} />
      <Route path="/staff/profile" element={<ProtectedRoute staffOnly><StaffProfile /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin"                element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
      <Route path="/admin/movies"         element={<ProtectedRoute adminOnly><Movies /></ProtectedRoute>} />
      <Route path="/admin/theatres"       element={<ProtectedRoute adminOnly><Theatres /></ProtectedRoute>} />
      <Route path="/admin/shows"          element={<ProtectedRoute adminOnly><Shows /></ProtectedRoute>} />
      <Route path="/admin/bookings"       element={<ProtectedRoute adminOnly><Bookings /></ProtectedRoute>} />
      <Route path="/admin/users"          element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
      <Route path="/admin/window-booking" element={<ProtectedRoute adminOnly><WindowBooking /></ProtectedRoute>} />
      <Route path="/admin/scanner"        element={<ProtectedRoute adminOnly><Scanner /></ProtectedRoute>} />
      <Route path="/admin/profile"        element={<ProtectedRoute adminOnly><AdminProfile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;