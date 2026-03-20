import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../api/axios";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      logout: async () => {
        await api.post("/auth/logout");
        set({ user: null, isAuthenticated: false });
      },

      clearAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "auth-storage", // stored in localStorage
    }
  )
);

export default useAuthStore;