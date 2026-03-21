/// <reference types="vite/client" />
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // ← sends cookies automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
      const data = error.response?.data;
    const message = data?.message || (data?.errors ? Object.values(data.errors)[0] : "Something went wrong");
    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;