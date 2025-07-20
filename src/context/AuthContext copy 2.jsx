import { createContext, useContext, useState, useEffect } from 'react';
import { getToken, logout, fetchUser } from '../api/auth';
import apiService from '../api/apiService';

// Auth Context for Global State Management
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(apiService.getToken());
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (authToken) {
                try {
                    const response = await apiService.get('/user');
                    setUser(response.data.user);
                } catch (error) {
                    console.error('Failed to fetch user:', error);
                    apiService.removeToken();
                    setAuthToken(null);
                    setUser(null);
                }
            }
            setLoadingAuth(false);
        };
        fetchUser();
    }, [authToken]);

    const login = async (email, password) => {
        setLoadingAuth(true);
        try {
            const response = await apiService.post('/login', { email, password });
            apiService.setToken(response.data.access_token);
            setAuthToken(response.data.access_token);
            setUser(response.data.user);
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error('Login failed:', error);
            console.error('Message:', error);
            setLoadingAuth(false);
            return { success: false, message: error.message || 'Login failed', errors: error.errors };
        }
    };

    const register = async (name, email, password, password_confirmation) => {
        setLoadingAuth(true);
        try {
            const response = await apiService.post('/register', { name, email, password, password_confirmation });
            apiService.setToken(response.data.access_token);
            setAuthToken(response.data.access_token);
            setUser(response.data.user);
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error('Registration failed:', error);
            setLoadingAuth(false);
            return { success: false, message: error.message || 'Registration failed', errors: error.errors };
        }
    };

    const logout = async () => {
        setLoadingAuth(true);
        try {
            await apiService.post('/logout');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            apiService.removeToken();
            setAuthToken(null);
            setUser(null);
            setLoadingAuth(false);
        }
    };

    const hasRole = (roleName) => {
        return user && user.roles && user.roles.some(role => role.name === roleName);
    };

    const hasPermission = (permissionName) => {
        return user && user.permissions && user.permissions.some(permission => permission.name === permissionName);
    };

    const value = {
        user,
        authToken,
        loadingAuth,
        login,
        register,
        logout,
        hasRole,
        hasPermission,
    };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

