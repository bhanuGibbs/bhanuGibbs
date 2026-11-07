import { useEffect, useState } from 'react';
import { AuthContextValue } from './AuthContextValue';
import {
  getStoredToken,
  getStoredRefreshToken,
  getStoredUser,
  getCurrentUser,
  loginUser,
  logoutUser,
  logoutBackend,
  registerUser,
  refreshAuthToken,
} from '../integration/backend/auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setIsAuthenticated(false);
      setSessionExpired(true);
    };

    window.addEventListener('ledger:session-expired', handleSessionExpired);
    return () => window.removeEventListener('ledger:session-expired', handleSessionExpired);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const token = getStoredToken();
      const refreshToken = getStoredRefreshToken();
      if (!token && !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        // Timeout after 5 seconds if the backend is unreachable
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Backend connection timeout')), 5000)
        );
        const currentUser = await Promise.race([getCurrentUser(), timeout]);
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch {
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
    setSessionExpired(false);
    return tokenData;
  };

  const register = async (payload) => {
    await registerUser(payload);
    return login(payload);
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
    setSessionExpired(false);
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
    <AuthContextValue.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        sessionExpired,
        login,
        register,
        logout,
        refreshToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContextValue.Provider>
  );
};
