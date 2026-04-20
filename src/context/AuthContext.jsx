import { createContext, useContext, useState, useEffect } from 'react';
import auth from '../api/auth'; 
import apiService from '../api/apiService'; 

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserSession = async () => {
            const token = apiService.getToken();

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await auth.fetchUser();
                setUser(response); 
            } catch (error) {
                console.error("Failed to restore user session:", error);
                logout(); 
            } finally {
                setLoading(false);
            }
        };

        fetchUserSession();
    }, []); 

    const login = async (credentials) => {
        setLoading(true);
        try {
            await auth.login(credentials); 
            const userResponse = await auth.fetchUser(); 
            setUser(userResponse); 
            return userResponse; 
        } catch (error) {
            // FIX: Attach the full response so we can read Laravel's validation errors
            const err = new Error(error.response?.data?.message || 'Login failed');
            err.response = error.response;
            throw err;
        } finally {
            setLoading(false);
        }
    };
    
    const telegramLogin = async (tgPayload) => {
        setLoading(true);
        try {
            await auth.telegram(tgPayload);
            const userResponse = await auth.fetchUser();
            setUser(userResponse);
            return userResponse;
        } catch (error) {
            const err = new Error(error.response?.data?.message || 'Telegram login failed');
            err.response = error.response;
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
            await auth.register(userData);
            const userResponse = await auth.fetchUser(); 
            setUser(userResponse); 
        } catch (error) {
            console.error('Registration error:', error);
            const err = new Error(error.response?.data?.message || 'Registration failed');
            err.response = error.response;
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await auth.logout();
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = async ({ silent = true } = {}) => {
        if (!silent) setLoading(true);
        try {
            const token = apiService.getToken?.();
            if (!token) { setUser(null); return null; }
            const fresh = await auth.fetchUser();
            setUser(fresh);
            return fresh;
        } catch (e) {
            console.error("refreshUser failed:", e);
            return null;
        } finally {
            if (!silent) setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading, refreshUser, telegramLogin }}>
            {children}
        </AuthContext.Provider>
    );
};