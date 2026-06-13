import { api } from "./client";

/**
 * Retrieves all loans.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getLoansRequest = () => api.get("/prestamos");

/**
 * Retrieves the loan history for a specific RUT.
 * @param {string} rut - The user's RUT.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getLoansByRutRequest = (rut) => api.get(`/prestamos/history/${rut}`);

/**
 * Retrieves all pending special loans (e.g., for email alerts).
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getSpecialPendingLoansRequest = () => api.get("/prestamos/pendientes-especiales");

/**
 * Creates a new loan.
 * @param {Object} data - The loan data payload.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const createLoanRequest = (data) => api.post("/prestamos", data);

/**
 * Marks a loan as returned.
 * @param {string} id - The loan ID.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const returnLoanRequest = (id) => api.patch(`/prestamos/return/${id}`);