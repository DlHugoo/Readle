import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // On mount, check if we have a valid session (via HTTPOnly cookie)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // This will send the HTTPOnly cookie automatically
        const response = await apiClient.get("/api/auth/me");
        if (response.data) {
          setUser({
            userId: response.data.id,
            email: response.data.email,
            role: response.data.role,
          });
        }
      } catch (error) {
        console.log("Not authenticated");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async ({ email, password }) => {
    try {
      // Backend will set HTTPOnly cookie
      const response = await apiClient.post("/api/auth/login", {
        email,
        password,
      });

      // Store only non-sensitive data in memory
      setUser({
        userId: response.data.userId,
        email: response.data.email,
        role: response.data.role,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend to clear cookie
      await apiClient.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};


