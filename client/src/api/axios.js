/// <reference types="vite/client" />
import axios from "axios";

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/signup",
  "/auth/verify-signup",
  "/auth/verify-login",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/resend-otp",
];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublicRoute = PUBLIC_ROUTES.some((route) =>
      error.config?.url?.includes(route)
    );

    // Auto logout on 401 — only for protected routes
    if (error.response?.status === 401 && !isPublicRoute) {
      import("../store/authStore").then(({ default: useAuthStore }) => {
        useAuthStore.getState().clearAuth();
      });
      window.location.href = "/login";
    }

    const data = error.response?.data;
    const message = data?.message || (data?.errors ? Object.values(data.errors)[0] : "Something went wrong");
    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;