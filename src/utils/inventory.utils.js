export const MAX_EXTENSION_RANGE = 50;

/**
 * Generates an array of formatted extension codes.
 * * @param {string} prefix - The alphanumeric prefix (e.g., 'NBP').
 * @param {number} start - The starting index.
 * @param {number} end - The ending index.
 * @returns {string[]} An array of generated codes.
 */
export function generateExtensionCodes(prefix, start, end) {
    const codes = [];
    for (let i = start; i <= end; i++) {
        codes.push(`${prefix}-${String(i).padStart(2, "0")}`);
    }
    return codes;
}

/**
 * Validates the parameters for generating multiple extensions and checks for collisions.
 * Employs the Result Pattern for predictable error handling.
 * * @param {string} prefix - The extension prefix.
 * @param {number} start - The start range.
 * @param {number} end - The end range.
 * @param {Set<string>} [existingCodes] - Optional set of existing codes to check collisions against.
 * @returns {{ error: string | null, codes?: string[] }}
 */
export function validateExtensionGeneration(prefix, start, end, existingCodes = new Set()) {
    const cleanPrefix = (prefix || "").trim();

    if (!cleanPrefix) return { error: "El prefijo no puede estar vacío." };
    if (start < 1) return { error: '"Desde" debe ser mayor o igual a 1.' };
    if (end < start) return { error: '"Hasta" debe ser mayor o igual a "Desde".' };

    const requestedAmount = end - start + 1;
    if (requestedAmount > MAX_EXTENSION_RANGE) {
        return { error: `El rango máximo permitido es ${MAX_EXTENSION_RANGE} (pediste ${requestedAmount}).` };
    }

    const newCodes = generateExtensionCodes(cleanPrefix, start, end);

    if (existingCodes && existingCodes.size > 0) {
        const collisions = newCodes.filter((code) => existingCodes.has(code));
        if (collisions.length > 0) {
            return { error: `Código(s) ya existente(s): ${collisions.join(", ")}` };
        }
    }

    return { error: null, codes: newCodes };
}

/**
 * Strategy mapping for building item-specific payload data based on its type.
 */
const payloadStrategies = {
    unitario: (item) => ({ stock: Number(item.stock) || 0 }),
    categoria: (item) => ({ extensiones: item.extensiones || [] }),
};

/**
 * Builds the final payload for creating or updating an inventory item.
 * Utilizes the Strategy Pattern to dynamically resolve fields avoiding complex if/else chains.
 * * @param {Object} item - The raw item state.
 * @returns {Object} The sanitized API payload.
 * @throws {Error} If the item type is unmapped/invalid.
 */
export function buildItemPayload(item) {
    const basePayload = {
        nombre: item.nombre,
        descripcion: item.descripcion,
        categoria: item.categoria,
        tipo: item.tipo,
    };

    const specificStrategy = payloadStrategies[item.tipo];

    if (!specificStrategy) {
        throw new Error(`Tipo de item no soportado: ${item.tipo}`);
    }

    return { ...basePayload, ...specificStrategy(item) };
}