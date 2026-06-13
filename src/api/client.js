import axios from "axios";

const url = /*"https://poto-back.inf.santiago.usm.cl"*/ "http://localhost:4000";
export default url;

/** @const {boolean} ignoreAuthBackend - Check if backend and auth is being ignored */
export const ignoreAuthBackend = false;

export const api = axios.create({
    baseURL: url,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token)
        config.headers.Authorization = `Bearer ${token}`;
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
                console.warn("Mock Mode: Suppressed 401 Unauthorized window reload.");
            }
        }
        return Promise.reject(error);
    }
);