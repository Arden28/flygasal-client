import { createContext, useContext, useState, useEffect } from 'react';
import auth from '../api/auth';
import apiService from '../api/apiService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Validate user session on mount
    useEffect(() => {
        const fetchUser = async () => {
            const token = apiService.getToken();
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await auth.fetchUser(); // Fetch user data
                setUser(response);
            } catch {
                // Logout user
                logout();
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    const login = async (credentials) => {
        await auth.login(credentials);
        const userResponse = await auth.fetchUser();
        setUser(userResponse);
    };

    const register = async (userData) => {
        await auth.register(userData);
    };

    const logout = () => {
        auth.logout();
        setUser(null);
    };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
