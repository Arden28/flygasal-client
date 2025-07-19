// src/api/auth.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// Utility to get token from localStorage
export const getToken = () => localStorage.getItem("token");

// Attach token to request headers
const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

// Login: Get token and user
export const login = async (email, password) => {
  const response = await API.post("/auth/login", { email, password });
  const { token, user } = response.data;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  return user;
};

// Logout: Invalidate token on server
export const logout = async () => {
  await API.post("/auth/logout", {}, authHeader());
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Register
export const register = async (userData) => {
  const response = await API.post("/auth/register", userData);
  return response.data;
};

// Get current user
export const fetchUser = async () => {
  const response = await API.get("/auth/user", authHeader());
  return response.data;
};

export default API;
