import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken } from "../api/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Track initial auth check
  const navigate = useNavigate();

  const login = ({ token, role, userId, email }) => {
    const userData = { token, role, userId, email };
    setUser(userData);
    setAccessToken(token);
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    navigate("/login");
  };

  useEffect(() => {
    // On initial load we don't hydrate from localStorage anymore.
    // If needed, you can call /api/auth/refresh here to get a fresh access token.
    setLoading(false); // Mark auth check as complete
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);