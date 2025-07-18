import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  withCredentials: false, // We're using token-based auth
});

// Interceptor for handling global errors (optional)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Store token in localStorage
const setToken = (token) => {
  localStorage.setItem("access_token", token);
};

// Remove token from localStorage
const removeToken = () => {
  localStorage.removeItem("access_token");
};

// Get token from localStorage
const getToken = () => {
  return localStorage.getItem("access_token");
};

export const login = async (credentials) => {
  try {
    // CSRF token for Sanctum (still needed even for token-based routes)
    await axios.get("http://127.0.0.1:8000/sanctum/csrf-cookie");

    const res = await API.post("/auth/login", credentials);

    const token = res.data?.access_token;
    if (token) {
      setToken(token);
    }

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

export const logout = async () => {
  const token = getToken();
  if (!token) throw new Error("No authentication token provided");

  try {
    const res = await API.post(
      "/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    removeToken();
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Logout failed");
  }
};

export const user = async () => {
  const token = getToken();
  if (!token) throw new Error("No authentication token found");

  try {
    const res = await API.get("/auth/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch user");
  }
};

export { getToken, setToken, removeToken };
export default API;
