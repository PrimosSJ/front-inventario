/**
 * Removes diacritics (accents) and converts the string to lowercase.
 * @param {string} text - The raw input string.
 * @returns {string} The normalized, clean string.
 */
export function normalizeText(text) {
    if (!text) return "";
    return text
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Validates if the target text contains the search query safely after normalization.
 * @param {string} targetText - The field text to search within (e.g., name, description).
 * @param {string} normalizedQuery - The pre-normalized search query.
 * @returns {boolean} True if the target text matches the query criteria.
 */
export function lazyMatch(targetText, normalizedQuery) {
    if (!normalizedQuery) return true;
    return normalizeText(targetText).includes(normalizedQuery);
}