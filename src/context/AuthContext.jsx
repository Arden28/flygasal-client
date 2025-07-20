import { createContext, useContext, useState, useEffect } from 'react';
import { getToken, logout, fetchUser } from '../api/auth';

export const AuthContext = createContext();

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // const [user, setUser] = useState(() => safeParse(localStorage.getItem('user')));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch (e) {
      console.error("Invalid user in localStorage:", e);
      return null;
    }
  });
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
      console.log(user.name); // "Arden Bouet"
      localStorage.setItem('user', JSON.stringify(currentUser)); // update localStorage with fresh data
    } catch (error) {
      console.warn("Session validation failed:", error.message);
      logoutUser(); // better: use the existing logoutUser() function to clear safely
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
    await logout(); // Server logout
  } catch (e) {
    console.warn("Server logout failed:", e.message); // Gracefully handle
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
  }
};

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
