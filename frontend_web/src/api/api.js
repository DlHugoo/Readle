// src/api/api.js
import axios from "axios";

// Set in frontend_web/.env.local:
// VITE_BACKEND_BASE=http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000  (or leave empty if using Vite proxy)
const BASE = "http://ec2-3-25-81-177.ap-southeast-2.compute.amazonaws.com:3000";

// ---- token helpers ----
export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => {
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
};

// Single axios client for the app
export const apiClient = axios.create({
  baseURL: BASE || undefined,
  withCredentials: false, // not using cookies
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
  if (data?.token) setToken(data.token);
  return data; // { token, role, userId }
};

export const logout = () => setToken(null);

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
