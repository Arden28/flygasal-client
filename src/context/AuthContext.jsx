import { createContext, useContext, useState, useEffect } from 'react';
import auth from '../api/auth'; // Assumed to handle token storage (e.g., localStorage) and API calls
import apiService from '../api/apiService'; // Assumed to handle token retrieval

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // This useEffect hook is crucial for session persistence.
    // It runs once when the component mounts to check for an existing session.
    useEffect(() => {
        const fetchUserSession = async () => {
            // Attempt to retrieve a token from persistent storage (e.g., localStorage)
            // 'apiService.getToken()' is assumed to fetch this token.
            const token = apiService.getToken();

            if (!token) {
                // If no token exists, there's no active session to restore.
                setLoading(false);
                return;
            }

            try {
                // If a token is found, attempt to fetch the user's data using it.
                // 'auth.fetchUser()' is assumed to validate the token with your backend
                // and return user details if the token is valid.
                const response = await auth.fetchUser();
                setUser(response); // Set the user state if the session is valid
            } catch (error) {
                // If fetching the user fails (e.g., token is expired or invalid),
                // log out the user to clear any stale session data.
                console.error("Failed to restore user session:", error);
                logout(); // Call the logout function to clear local session data
            } finally {
                // Regardless of success or failure, set loading to false
                // to indicate that the authentication state has been determined.
                setLoading(false);
            }
        };

        fetchUserSession();
    }, []); // Empty dependency array ensures this runs only once on mount

    // Handles user login.
    const login = async (credentials) => {
        // 'auth.login(credentials)' is assumed to send credentials to the backend,
        // receive a new token, and store it in persistent storage (e.g., localStorage).
        await auth.login(credentials);
        // After successful login, fetch the authenticated user's data.
        const userResponse = await auth.fetchUser();
        setUser(userResponse);
    };

    // Handles user registration.
    const register = async (userData) => {
        // 'auth.register(userData)' sends registration data to the backend.
        // It typically does not log the user in directly, but creates the account.
        await auth.register(userData);
        // User will likely need to log in after registration or be redirected to a success page.
    };

    // Handles user logout.
    const logout = () => {
        // 'auth.logout()' is assumed to clear the token from persistent storage.
        auth.logout();
        setUser(null); // Clear the user state in the context
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
