import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";
import api from "./api/axios";

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
import Payment from "./pages/user/Payment";
import MyBookings from "./pages/user/MyBookings";
import BookingConfirm from "./pages/user/BookingConfirm";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Movies from "./pages/admin/Movies";
import Theatres from "./pages/admin/Theatres";
import Shows from "./pages/admin/Shows";
import Bookings from "./pages/admin/Bookings";
import Users from "./pages/admin/Users";
import WindowBooking from "./pages/admin/WindowBooking";

// Components
import ProtectedRoute from "./components/common/ProtectedRoute";

function App() {
  const { isAuthenticated, user, authChecked } = useAuthStore();
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setAuthChecked = useAuthStore((state) => state.setAuthChecked);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await api.get("/users/me");
        setUser(res.data);
      } catch {
        clearAuth();
      } finally {
        setAuthChecked();
      }
    };
    verifyAuth().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show loading spinner while auth is being verified
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="animate-spin h-8 w-8 text-primary"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <p className="text-muted text-sm">Loading CineBook...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<OTPVerify />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/*
        Root route logic:
        - Not logged in      → LandingPage
        - Logged in as ADMIN → /admin
        - Logged in as USER  → Home
      */}
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <LandingPage />
          ) : user?.role === "ADMIN" ? (
            <Navigate to="/admin" replace />
          ) : (
            <Home />
          )
        }
      />

      {/* Show details — accessible to all */}
      <Route path="/shows/:id" element={<ShowDetails />} />

      {/* Protected user routes */}
      <Route
        path="/payment"
        element={<ProtectedRoute><Payment /></ProtectedRoute>}
      />
      <Route
        path="/my-bookings"
        element={<ProtectedRoute><MyBookings /></ProtectedRoute>}
      />
      <Route
        path="/booking-confirm"
        element={<ProtectedRoute><BookingConfirm /></ProtectedRoute>}
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/admin/movies"
        element={<ProtectedRoute adminOnly><Movies /></ProtectedRoute>}
      />
      <Route
        path="/admin/theatres"
        element={<ProtectedRoute adminOnly><Theatres /></ProtectedRoute>}
      />
      <Route
        path="/admin/shows"
        element={<ProtectedRoute adminOnly><Shows /></ProtectedRoute>}
      />
      <Route
        path="/admin/bookings"
        element={<ProtectedRoute adminOnly><Bookings /></ProtectedRoute>}
      />
      <Route
        path="/admin/users"
        element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>}
      />
      <Route
        path="/admin/window-booking"
        element={<ProtectedRoute adminOnly><WindowBooking /></ProtectedRoute>}
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
