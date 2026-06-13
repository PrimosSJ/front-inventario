/**
 * Extracts and formats a valid RUT from a raw input string.
 * @param {string} input - The raw input text.
 * @returns {string} The extracted RUT.
 */
export function extractRutFromInput(input) {
    const runMatch = input.match(/RUN¿([\d']+)/);
    if (runMatch && runMatch[1]) {
        return runMatch[1].replace("'", '').slice(0, 8);
    }

    if (input.length === 18 && !isNaN(input)) {
        return input.slice(-8);
    }

    return input;
}

/**
 * Formats a valid RUT from a raw input string.
 * @param {string} input - The raw input text.
 * @returns {string} Formatted RUT.
 */
export function formatRut(input) {
    if (!input) return "-";

    // 1. Limpiar todo lo que no sea número o letra K
    const cleanRut = String(input).replace(/[^0-9kK]/g, '').toUpperCase();
    if (cleanRut.length < 2) return cleanRut;

    // 2. Separar el dígito verificador del cuerpo
    const dv = cleanRut.slice(-1);
    let body = cleanRut.slice(0, -1);

    // 3. Agregar los puntos separadores de miles al cuerpo
    body = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return `${body}-${dv}`;
}