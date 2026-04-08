import { create } from "zustand";
import api from "../api/axios";

// ─── NO persist middleware ─────────────────────────────────────────────────────
// The httpOnly cookie is the source of truth.
// Persisting isAuthenticated/user to localStorage causes stale state on refresh
// — the user appears logged in before verifyAuth (in App.jsx) has run.
// ──────────────────────────────────────────────────────────────────────────────

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  authChecked: false,         // stays false until verifyAuth resolves

  setUser: (user) => set({ user, isAuthenticated: true }),

  setAuthChecked: () => set({ authChecked: true }),

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // even if the request fails, clear client state
    }
    set({ user: null, isAuthenticated: false, authChecked: true });
  },

  clearAuth: () => set({ user: null, isAuthenticated: false, authChecked: true }),
}));

// ─── Multi-tab logout sync ─────────────────────────────────────────────────────
// Without persist there's no "auth-storage" key to watch, so we use a simple
// custom localStorage flag that logout() can set manually if you need tab sync.
// (Optional — remove if you don't need it.)
window.addEventListener("storage", (e) => {
  if (e.key === "cinebook-logout") {
    useAuthStore.getState().clearAuth();
    window.location.href = "/";
  }
});

export default useAuthStore;