import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      authChecked: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setAuthChecked: () => set({ authChecked: true }),

      logout: async () => {
        await api.post("/auth/logout");
        localStorage.removeItem("auth-storage"); // ← added
        set({ user: null, isAuthenticated: false, authChecked: true });
      },

      clearAuth: () => {
        localStorage.removeItem("auth-storage"); // ← added
        set({ user: null, isAuthenticated: false, authChecked: true });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }), // ← added
    }
  )
);

// Multi-tab logout sync
window.addEventListener("storage", (e) => {
  if (e.key === "auth-storage") {
    const newValue = e.newValue ? JSON.parse(e.newValue) : null;
    if (!newValue?.state?.isAuthenticated) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }
  }
});

export default useAuthStore;