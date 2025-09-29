import { useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../contexts/AuthContext";
import { getApiBaseUrl } from "../../utils/apiConfig";

const BASE = getApiBaseUrl();

export default function AuthCallback() {
  const { login: authLogin } = useAuth();

  useEffect(() => {
    (async () => {
      const url = new URL(window.location.href);
      const search = url.searchParams;
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      // token can come from query OR hash
      const token = search.get("token") || hash.get("token") || "";
      const err   = search.get("error") || hash.get("error");
      let next    = search.get("next") || "/library";

      if (err) {
        window.location.replace("/login?oauth=failed");
        return;
      }
      if (!token || token === "undefined" || token === "null") {
        window.location.replace("/login?oauth=missing");
        return;
      }

      // Persist token + set global default for any other axios usage in the app
      try { localStorage.setItem("token", token); } catch {}
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      // Use a dedicated axios instance for the calls here (also adds baseURL)
      const api = axios.create({ baseURL: BASE, withCredentials: true });
      api.interceptors.request.use((config) => {
        const t = localStorage.getItem("token");
        if (t) config.headers.Authorization = `Bearer ${t}`;
        return config;
      });

      // Only allow internal paths for "next"
      try {
        const probe = new URL(next, window.location.origin);
        if (probe.origin !== window.location.origin || !probe.pathname.startsWith("/")) {
          next = "/library";
        }
      } catch {
        next = "/library";
      }
      if (next === "/auth/callback") next = "/library";

      // Ask backend who I am → hydrate context so guards are happy
      try {
        const { data } = await api.get("/api/auth/me");
        // expected shape: { id, email, role } (adjust if yours differs)
        const role   = data?.role || "STUDENT";
        const userId = data?.id;
        const email  = data?.email;

        authLogin({ token, role, userId, email });

        // If no explicit next, choose sensible default by role
        if (!search.get("next")) {
          if (role === "ADMIN") next = "/admin-dashboard";
          else if (role === "TEACHER") next = "/classroom";
          else next = "/library";
        }
      } catch {
        // If /me fails, we still keep the token and try the default route.
        // Guards can re-check later.
      }

      // Final hop
      window.location.replace(next);
    })();
  }, [authLogin]);

  return <div>Signing you in…</div>;
}
