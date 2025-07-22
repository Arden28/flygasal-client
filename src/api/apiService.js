// src/api/apiService.js

// A simple utility to make authenticated API requests to the Laravel backend.
// const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Replace with your Laravel API URL
const API_BASE_URL = 'https://flygasal.koverae.com/api'; // Replace with your Laravel API URL

const apiService = {
    // Helper to get the auth token from local storage
    getToken: () => localStorage.getItem('authToken'),

    // Helper to set the auth token in local storage
    setToken: (token) => localStorage.setItem('authToken', token),

    // Helper to remove the auth token from local storage
    removeToken: () => localStorage.removeItem('authToken'),

    // Generic request method with authorization header
    request: async (method, path, data = null) => {
        const token = apiService.getToken();
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: method,
            headers: headers,
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${path}`, config);
            const contentType = response.headers.get('content-type');

            if (response.status === 204) { // No Content
                return { success: true, data: null, status: response.status };
            }

            if (contentType && contentType.includes('application/json')) {
                const jsonResponse = await response.json();
                if (!response.ok) {
                    // If response is not ok (e.g., 4xx, 5xx), throw an error with the JSON body
                    const error = new Error(jsonResponse.message || 'API request failed');
                    error.errors = jsonResponse.errors || {};
                    error.status = response.status;
                    throw error;
                }
                return { success: true, data: jsonResponse, status: response.status };
            } else {
                // Handle non-JSON responses (e.g., HTML error pages)
                const textResponse = await response.text();
                const error = new Error(`Unexpected response type or API error: ${textResponse.substring(0, 100)}`);
                error.status = response.status;
                throw error;
            }
        } catch (error) {
            console.error('API Service Error:', error);
            throw error; // Re-throw for component-level handling
        }
    },

    get: (path) => apiService.request('GET', path),
    post: (path, data) => apiService.request('POST', path, data),
    put: (path, data) => apiService.request('PUT', path, data),
    delete: (path) => apiService.request('DELETE', path),
};

export default apiService;

