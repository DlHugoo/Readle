import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken, refreshToken, getMe } from "../api/api";

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
    // Try to restore session on page load using the HTTPOnly refresh cookie
    const restoreSession = async () => {
      try {
        // Attempt to refresh the access token using the HTTPOnly cookie
        const token = await refreshToken();
        
        if (token) {
          // If refresh succeeded, fetch user data
          const userData = await getMe();
          setUser({
            userId: userData.id,
            email: userData.email,
            role: userData.role,
            firstName: userData.firstName,
            lastName: userData.lastName,
          });
        }
      } catch (error) {
        console.log("No active session or refresh failed:", error.message);
        // User stays logged out
      } finally {
        setLoading(false); // Mark auth check as complete
      }
    };

    restoreSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);