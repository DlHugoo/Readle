// src/api/api.js
import axios from "axios";

// Use environment variable for API base URL
// For production: empty string uses Vercel proxy (HTTPS to HTTPS)
// For local dev: set VITE_API_BASE_URL=http://localhost:3000
const BASE = import.meta.env.VITE_API_BASE_URL || "";

// ---- token helpers (DEPRECATED - kept for backward compatibility) ----
// ⚠️ These are no longer used with HTTPOnly cookies
// Token is now managed automatically by the browser
export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => {
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
};

// Single axios client for the app
export const apiClient = axios.create({
  baseURL: BASE || undefined,
  withCredentials: true, // ✅ IMPORTANT: Send HTTPOnly cookies automatically
  headers: { "Content-Type": "application/json" },
});

// ✅ Token is now sent automatically via HTTPOnly cookie
// No need for manual Authorization header management

// Auto-logout on 401 (expired/invalid token)
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      setToken(null);
      // Optionally preserve where the user was:
      // const from = encodeURIComponent(window.location.pathname + window.location.search);
      // window.location.replace(`/login?expired=1&from=${from}`);
    }
    return Promise.reject(err);
  }
);

// --- Books ---
export const fetchBooks = async () => {
  const { data } = await apiClient.get("/api/books/public");
  return data;
};

// --- Auth / OTP ---
export const register = async (payload) => {
  const { data } = await apiClient.post("/api/auth/register", payload);
  return data; // { message: ... }
};

export const verifyEmail = async ({ email, code }) => {
  const { data } = await apiClient.post("/api/auth/verify-email", { email, code });
  return data;
};

export const resendOtp = async ({ email }) => {
  const { data } = await apiClient.post("/api/auth/resend", { email });
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await apiClient.post("/api/auth/login", { email, password });
  // ✅ Backend sets HTTPOnly cookie automatically
  // ✅ Response now contains: { userId, role, email, message }
  return data;
};

export const logout = async () => {
  // ✅ Call backend to clear HTTPOnly cookie
  try {
    await apiClient.post("/api/auth/logout");
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Who am I? (useful for role-based redirect)
export const getMe = async () => {
  const { data } = await apiClient.get("/api/auth/me");
  // e.g. { id, email, role, ... }
  return data;
};

// Microsoft OAuth (server handles redirect)
export const startMicrosoftLogin = () => {
  window.location.href = "/auth/microsoft/start";
};
