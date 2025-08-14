// src/api/api.js
import axios from "axios";

// Set this in frontend_web/.env.local:  VITE_BACKEND_BASE=http://localhost:8080
const BASE = import.meta.env.VITE_BACKEND_BASE || "";

// Single axios client for the app
export const apiClient = axios.create({
  baseURL: BASE,               // if you use a Vite proxy, leave BASE = ""
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

// Attach JWT from localStorage (if present) on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Books ---
export const fetchBooks = async () => {
  const { data } = await apiClient.get("/api/books/public");
  return data;
};

// --- Auth / OTP ---
export const register = async (payload) => {
  const { data } = await apiClient.post("/api/auth/register", payload);
  return data; // { message: "Check your email..." }
};

export const verifyEmail = async ({ email, code }) => {
  const { data } = await apiClient.post("/api/auth/verify-email", { email, code });
  return data; // { message: "Email verified..." }
};

export const resendOtp = async ({ email }) => {
  const { data } = await apiClient.post("/api/auth/resend", { email });
  return data; // { message: "A new verification code has been sent." }
};

export const login = async ({ email, password }) => {
  const { data } = await apiClient.post("/api/auth/login", { email, password });
  if (data?.token) localStorage.setItem("token", data.token); // persist JWT
  return data; // { token, role, userId }
};

export const logout = () => {
  localStorage.removeItem("token");
};
