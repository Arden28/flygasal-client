import { createContext, useContext, useState, useEffect } from 'react';
import { getToken, logout, fetchUser } from '../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate user session on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await fetchUser();
        setUser(currentUser);
      } catch (error) {
        console.warn("Session validation failed:", error.message);
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();
  }, []);

  const loginUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const logoutUser = async () => {
    try {
      await logout();
    } catch (error) {
      console.warn("Logout failed on server:", error.message);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
