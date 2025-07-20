// src/api/auth.js
import axios from "axios";

const API = axios.create({
  baseURL: "https://flygasal.koverae.com/api",
});

// Utility to get token from localStorage
export const getToken = () => localStorage.getItem("authToken");

// Attach token to request headers
const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

// Login: Get token and user
export const login = async (email, password) => {
  try {
    const response = await API.post("/login", { email, password });
    const { token, user } = response.data;

    // Persist to localStorage
    localStorage.setItem("authToken", token);
    localStorage.setItem("user", JSON.stringify(user));

    return {
      success: true,
      user,
      token,
      message: "Login successful",
    };
  } catch (error) {
    return {
      success: false,
      errors: error?.response?.data?.errors || {},
      message: error?.response?.data?.message || "Login failed",
    };
  }
};

// Logout: Invalidate token on server
export const logout = async () => {
  await API.post("/logout", {}, authHeader());
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
};

// Register
export const register = async (userData) => {
  const response = await API.post("/register", userData);
  return response.data;
};

// Get current user
export const fetchUser = async () => {
  const response = await API.get("/user", authHeader());
  return response.data;
};

export default API;
