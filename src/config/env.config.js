/**
 * Centralized environment configuration.
 * Validates and exposes environment variables to prevent hardcoded values across the app.
 */
export const ENV = {
    API_URL: import.meta.env.VITE_API_URL || "http://localhost:4000", /*"https://poto-back.inf.santiago.usm.cl"*/
    IGNORE_AUTH: import.meta.env.VITE_IGNORE_AUTH_BACKEND === "true",
    /**
     * Envío de correos (EmailJS). Desactivado por defecto: solo se habilita si
     * VITE_EMAIL_ENABLED === "true" (requiere las keys VITE_EMAILJS_* configuradas).
     * Mientras esté en false, el servicio de email es un no-op y no genera errores.
     */
    EMAIL_ENABLED: import.meta.env.VITE_EMAIL_ENABLED === "true",
};