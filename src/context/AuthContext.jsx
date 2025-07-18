import { createContext, useContext, useState, useEffect } from 'react';
import { logout } from '../api/auth';
// logout
import API from '../api/auth';
// import API from '../../api/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate user session on mount
  useEffect(() => {
    const validateSession = async () => {
      try {
        const res = await API.get('/user'); // Assuming a /user endpoint to fetch current user
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (error) {
        setUser(null);
        localStorage.removeItem('user');
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
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);