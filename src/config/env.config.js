/**
 * Centralized environment configuration.
 * Validates and exposes environment variables to prevent hardcoded values across the app.
 */
export const ENV = {
    API_URL: import.meta.env.VITE_API_URL || "http://localhost:4000",
    IGNORE_AUTH: import.meta.env.VITE_IGNORE_AUTH_BACKEND === "true",
};