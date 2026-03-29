import axios from "axios";
import useAuthStore from "../store/authStore"; // ✅ static import

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
      useAuthStore.getState().clearAuth(); // ✅ no await import needed
    }

    const data = error.response?.data;
    const message =
      data?.message ||
      (data?.errors ? Object.values(data.errors)[0] : "Something went wrong");
    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;