// src/api/api.js
import axios from "axios";

// Use environment variable for API base URL
// For production: empty string uses Vercel proxy (HTTPS to HTTPS)
// For local dev: set VITE_API_BASE_URL=http://localhost:3000
const BASE = import.meta.env.VITE_API_BASE_URL || "";

// ---- in-memory access token (no localStorage) ----
let inMemoryAccessToken = null;
export const setAccessToken = (t) => { inMemoryAccessToken = t || null; };
export const getAccessToken = () => inMemoryAccessToken;

// Single axios client for the app
export const apiClient = axios.create({
  baseURL: BASE || undefined,
  withCredentials: true, // send HttpOnly refresh cookie
  headers: { "Content-Type": "application/json" },
});

// Attach in-memory access token on every request
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh flow on 401
let refreshingPromise = null;
async function refreshToken() {
  if (!refreshingPromise) {
    refreshingPromise = apiClient.post("/api/auth/refresh")
      .then((res) => {
        setAccessToken(res.data?.token || res.data?.accessToken || null);
        return getAccessToken();
      })
      .finally(() => { refreshingPromise = null; });
  }
  return refreshingPromise;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err?.response?.status === 401) {
      try {
        await refreshToken();
        const cfg = err.config;
        const t = getAccessToken();
        if (t) cfg.headers.Authorization = `Bearer ${t}`;
        return apiClient(cfg);
      } catch (_) {
        setAccessToken(null);
      }
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
  if (data?.token) setAccessToken(data.token);
  return data; // { token, role, userId }
};

export const logout = async () => {
  try { await apiClient.post("/api/auth/logout"); } catch {}
  setAccessToken(null);
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
