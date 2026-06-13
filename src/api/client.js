import axios from "axios";
import { ENV } from "../config/env.config";

export const ignoreAuthBackend = ENV.IGNORE_AUTH;
export default ENV.API_URL;

export const api = axios.create({
    baseURL: ENV.API_URL,
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
            if (!ignoreAuthBackend) {
                localStorage.removeItem("token");
                window.location.reload();
            } else {
                console.warn("[Mock Mode] Suppressed 401 Unauthorized reload.");
            }
        }
        return Promise.reject(error);
    }
);