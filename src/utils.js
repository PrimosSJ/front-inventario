import axios from "axios";

const url = /*"https://poto-back.inf.santiago.usm.cl"*/ "http://localhost:4000";
export default url;

export const api = axios.create({
  baseURL: url,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${url}${endpoint}`, config);

    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.reload();
      return;
    }
    return await response.json();
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};
