import url from "./client";

/**
 * Verifies the user token against the backend.
 * @param {string} token - The authentication token.
 * @returns {Promise<Response>} The raw fetch response.
 */
export const verifyTokenRequest = async (token) => {
    return fetch(`${url}/auth/verify-token`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });
};

/**
 * Authenticates a user with email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<Response>} The raw fetch response.
 */
export const loginRequest = async (email, password) => {
    return fetch(`${url}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });
};