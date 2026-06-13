/**
 * Formats a given timestamp to DD/MM/YY HH:MM format.
 * @param {string|number|Date} timestamp - The date to format.
 * @returns {string} The formatted date string.
 */
export function formatTimestamp(timestamp) {
    if (!timestamp) return "-";
    const d = new Date(timestamp);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
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