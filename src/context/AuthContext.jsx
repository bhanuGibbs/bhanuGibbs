import { createContext, useContext, useEffect, useState } from 'react';
import {
  getStoredToken,
  getStoredUser,
  getCurrentUser,
  loginUser,
  logoutUser,
  logoutBackend,
  registerUser,
  refreshAuthToken,
} from '../integration/backend/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = getStoredToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            setIsAuthenticated(true);
            setLoading(false);
            return;
          } catch {
            // Ignore and fall through to logout.
          }
        }

        logoutUser();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials) => {
    const tokenData = await loginUser(credentials);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setIsAuthenticated(true);
    return tokenData;
  };

  const register = async (payload) => {
    await registerUser(payload);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      return currentUser;
    } catch {
      logout();
      return null;
    }
  };

  const logout = async () => {
    await logoutBackend();
    logoutUser();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshToken = async () => {
    const tokenResponse = await refreshAuthToken();
    if (tokenResponse) {
      setUser(getStoredUser());
    } else {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        refreshToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
