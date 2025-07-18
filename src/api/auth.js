import axios from "axios";

const API = axios.create({
  baseURL: "http://flygasal.test/api",
  withCredentials: true,
});

// Interceptor for handling global errors (optional)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log errors or handle globally (e.g., redirect to login on 401)
    console.error("API error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const login = async (credentials) => {
  try {
    // Call the CSRF cookie from the ROOT domain (NOT through /api)
    await axios.get("http://flygasal.test/sanctum/csrf-cookie", {
      withCredentials: true,
    });

    // Now make the login request
    const res = await API.post("/auth/login", credentials);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

export const register = async (data) => {
  try {
    await API.get("/sanctum/csrf-cookie");
    const res = await API.post("/auth/register", data);
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Registration failed");
  }
};

export const logout = async (token) => {
  if (!token) {
    throw new Error("No authentication token provided");
  }
  try {
    const res = await API.post(
      "/auth/logout",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Logout failed");
  }
};

export default API;