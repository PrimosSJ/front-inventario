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