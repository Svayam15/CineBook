import axios from "axios";

/// <reference types="vite/client" />

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/signup",
  "/auth/verify-signup",
  "/auth/verify-login",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/resend-otp",
  "/users/me",
];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      error.config?.url?.includes(route)
    );

    if (error.response?.status === 401 && !isPublicRoute) {
      const { default: useAuthStore } = await import("../store/authStore");
      useAuthStore.getState().clearAuth();
      // Don't hard redirect here — let ProtectedRoute handle it
      // clearAuth sets isAuthenticated: false, ProtectedRoute will navigate to /login
    }

    const data = error.response?.data;
    const message =
      data?.message ||
      (data?.errors ? Object.values(data.errors)[0] : "Something went wrong");
    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;