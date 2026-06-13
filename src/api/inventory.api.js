import { api } from "./client";

/**
 * Retrieves all inventory items.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getInventoryRequest = () => api.get("/inventario");

/**
 * Retrieves a single inventory item by ID.
 * @param {string} id - The item ID.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getInventoryItemRequest = (id) => api.get(`/inventario/${id}`);

/**
 * Retrieves available categories.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getCategoriesRequest = () => api.get("/inventario/categorias");

/**
 * Retrieves available extensions for a specific category item.
 * @param {string} id - The item ID.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getAvailableExtensionsRequest = (id) => api.get(`/inventario/${id}/extensiones-disponibles`);

/**
 * Creates a new inventory item.
 * @param {Object} data - The item data.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const createInventoryItemRequest = (data) => api.post("/inventario", data);

/**
 * Updates an existing inventory item.
 * @param {string} id - The item ID.
 * @param {Object} data - The updated data.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const updateInventoryItemRequest = (id, data) => api.put(`/inventario/${id}`, data);

/**
 * Deletes an inventory item.
 * @param {string} id - The item ID.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const deleteInventoryItemRequest = (id) => api.delete(`/inventario/${id}`);

/**
 * Processes a bulk import of inventory items.
 * @param {Array<Object>} items - The list of items to import.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const bulkImportInventoryRequest = (items) => api.post("/inventario/bulk", { items });

/**
 * Updates the comment of a specific extension.
 * @param {string} itemId - The parent item ID.
 * @param {string} codigo - The extension code.
 * @param {string} comentario - The new comment.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const updateExtensionCommentRequest = (itemId, codigo, comentario) =>
    api.patch(`/inventario/${itemId}/extensiones/${codigo}/comentario`, { comentario });