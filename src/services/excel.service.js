import * as XLSX from "xlsx";

/**
 * Returns today's date in YYYY-MM-DD format.
 * @returns {string}
 */
function fechaHoy() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Exports the inventory data to an Excel file.
 * @param {Array} inventory - The inventory array.
 */
export function exportarExcel(inventory) {
    const rows = inventory.map((item) => ({
        Nombre: item.nombre,
        Descripción: item.descripcion,
        Categoría: item.categoria,
        Tipo: item.tipo === "categoria" ? "categoría" : "unitario",
        Stock: item.stock,
        Extensiones:
            item.tipo === "categoria"
                ? (item.extensiones || []).map((e) => e.codigo).join(", ")
                : "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, `inventario_POTO_${fechaHoy()}.xlsx`);
}

const COLUMNAS_REQUERIDAS = ["Nombre", "Descripción", "Categoría", "Stock"];

/**
 * Parses an imported Excel file into inventory items.
 * @param {File} file - The uploaded Excel file.
 * @returns {Promise<Array>} Resolves with parsed items or rejects with an error message.
 */
export function parsearExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: "array" });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

                if (rows.length === 0) {
                    return reject("El archivo está vacío.");
                }

                const headers = Object.keys(rows[0]);
                const faltantes = COLUMNAS_REQUERIDAS.filter((c) => !headers.includes(c));
                if (faltantes.length > 0) {
                    return reject(`Columnas faltantes: ${faltantes.join(", ")}`);
                }

                const items = rows.map((row) => ({
                    nombre: String(row["Nombre"] || "").trim(),
                    descripcion: String(row["Descripción"] || "").trim(),
                    categoria: String(row["Categoría"] || "").trim(),
                    tipo: String(row["Tipo"] || "unitario").trim().toLowerCase() === "categoría" ? "categoria" : "unitario",
                    stock: parseInt(row["Stock"]) || 0,
                }));

                resolve(items);
            } catch (err) {
                reject("Error al leer el archivo: " + err.message);
            }
        };
        reader.onerror = () => reject("Error al leer el archivo.");
        reader.readAsArrayBuffer(file);
    });
}