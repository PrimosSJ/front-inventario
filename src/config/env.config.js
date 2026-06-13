/**
 * Centralized environment configuration.
 * Validates and exposes environment variables to prevent hardcoded values across the app.
 */
export const ENV = {
    API_URL: import.meta.env.VITE_API_URL || "http://localhost:4000", /*"https://poto-back.inf.santiago.usm.cl"*/
    IGNORE_AUTH: import.meta.env.VITE_IGNORE_AUTH_BACKEND === "true",
};