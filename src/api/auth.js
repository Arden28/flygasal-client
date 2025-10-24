// src/api/auth.js

import apiService from './apiService';

const auth = {

    // Helper to get user data from local storage
    getUser: () => localStorage.getItem('user'),

    // Helper to set user data in local storage
    setUser: (user) => localStorage.setItem('user', user),

    // Helper to remove user data from local storage
    removeUser: () => localStorage.removeItem('user'),

    login: async (credentials) => {
        const response = await apiService.post('/login', credentials);
        const { access_token: token } = response.data;
        // console.log('Login successful, token:', response.data);
        apiService.setToken(token);

        return response.data;
    },

    telegram: async (credentials) => {
        const response = await apiService.post('/telegram', credentials);
        const { access_token: token } = response.data;
        // console.log('Login successful, token:', response.data);
        apiService.setToken(token);

        return response.data;
    },

    register: async (userData) => {
        const response = await apiService.post('/register', userData);
        const { access_token: token } = response.data;
        // console.log('Login successful, token:', response.data);
        apiService.setToken(token);
        return response.data;
    },
    
    logout: async () => {
      const response = await apiService.post('/logout');
      apiService.removeToken();
      auth.removeUser();
      return response;
    },
    
    fetchUser: async () => {
        const response = await apiService.get('/user');
        const user = response.data;
        auth.setUser(user);
        return user;
    },
};

export default auth;
