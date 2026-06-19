/**
 * Formats a given timestamp into a human-readable, localized string tailored for es-CL.
 * Optimizes readability by hiding the current year and converting recent dates to "Hoy" or "Ayer".
 *
 * @param {string|number|Date} timestamp - The input timestamp to format.
 * @returns {string} The formatted date string, or "-" if the timestamp is invalid.
 * * @example
 * // Assuming current date is June 14, 2026:
 * formatTimestamp("2026-06-14T16:42:00Z"); // => "Hoy, 16:42"
 * formatTimestamp("2026-06-13T09:15:00Z"); // => "Ayer, 09:15"
 * formatTimestamp("2026-06-12T12:00:00Z"); // => "12 jun, 12:00"
 * formatTimestamp("2025-06-12T12:00:00Z"); // => "12 jun '25, 12:00"
 */
export function formatTimestamp(timestamp) {
    if (!timestamp) return "-";

    const targetDate = new Date(timestamp);
    if (isNaN(targetDate.getTime())) return "-";

    const now = new Date();

    // Reset times to midnight for precise calendar day comparisons
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffTime = nowMidnight.getTime() - targetMidnight.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Format hours and minutes securely
    const hh = String(targetDate.getHours()).padStart(2, "0");
    const min = String(targetDate.getMinutes()).padStart(2, "0");
    const timeString = `${hh}:${min}`;

    // Contextual handling for Today and Yesterday
    if (diffDays === 0) {
        return `Hoy, ${timeString}`;
    }
    if (diffDays === 1) {
        return `Ayer, ${timeString}`;
    }

    // Extract localized short month name for Chile (e.g., "jun.")
    const monthFormatter = new Intl.DateTimeFormat("es-CL", { month: "short" });
    let monthName = monthFormatter.format(targetDate).toLowerCase();

    // Clean trailing dots added by Intl localization to keep the layout minimalist
    if (monthName.endsWith(".")) {
        monthName = monthName.slice(0, -1);
    }

    const day = targetDate.getDate();

    // Conditional year rendering based on current system year
    if (targetDate.getFullYear() === now.getFullYear()) {
        return `${day} ${monthName}, ${timeString}`;
    }

    const shortYear = String(targetDate.getFullYear()).slice(-2);
    return `${day} ${monthName} '${shortYear}, ${timeString}`;
}

/**
 * Retrieves the creation date from a loan object.
 * @param {Object} prestamo - The loan object.
 * @returns {string|number|Date} The creation date.
 */
export function getPrestamoDate(prestamo) {
    return prestamo.createdAt || prestamo.timestamp;
}

/**
 * Calculates the remaining time or overdue time from an ISO date string.
 * @param {string} fechaIso - The target ISO date string.
 * @returns {{texto: string, clase: string}} The formatted text and CSS class.
 */
export function calcularTexto(fechaIso) {
    const ahora = new Date();
    const target = new Date(fechaIso);
    const diffMs = target.getTime() - ahora.getTime();
    const diffTotalHoras = diffMs / (1000 * 60 * 60);
    const diffDias = Math.floor(diffTotalHoras / 24);
    const horasRestantes = Math.floor(diffTotalHoras % 24);

    if (diffMs <= 0) {
        const vencidoHoras = Math.abs(Math.ceil(diffTotalHoras));
        if (vencidoHoras < 24) {
            return { texto: `Vencido hace ${vencidoHoras}h`, clase: "text-error font-bold" };
        }
        const vencidoDias = Math.ceil(Math.abs(diffTotalHoras) / 24);
        return { texto: `Vencido hace ${vencidoDias} día${vencidoDias !== 1 ? "s" : ""}`, clase: "text-error font-bold" };
    }

    if (diffTotalHoras < 24) {
        const horas = Math.ceil(diffTotalHoras);
        return { texto: `${horas}h restantes`, clase: "text-orange-500 font-semibold" };
    }

    if (diffDias <= 3) {
        return {
            texto: `${diffDias}d ${horasRestantes}h restantes`,
            clase: "text-warning font-semibold",
        };
    }

    return { texto: `${diffDias} días restantes`, clase: "text-success" };
}