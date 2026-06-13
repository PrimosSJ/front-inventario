import { useState, useRef } from "react";
import { parsearExcel } from "../services/excel.service";
import {
    bulkImportInventoryRequest as defaultBulkImport,
    getInventoryRequest as defaultGetInventory
} from "../api/inventory.api";

/**
 * Hook to handle the flow of parsing and bulk-importing Excel data.
 * @param {Function} setInventory - The state setter to refresh inventory.
 * @param {Object} apiDeps - Injectable API dependencies.
 */
export function useExcelImport(setInventory, { bulkImport = defaultBulkImport, getInventory = defaultGetInventory } = {}) {
    const [importPreview, setImportPreview] = useState(null);
    const [importError, setImportError] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [importando, setImportando] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImportError(null);
        setImportResult(null);
        try {
            const items = await parsearExcel(file);
            setImportPreview(items);
        } catch (err) {
            setImportError(String(err));
            setImportPreview(null);
        }
        e.target.value = "";
    };

    const confirmarImport = async () => {
        if (!importPreview) return;
        setImportando(true);
        try {
            const res = await bulkImport(importPreview);
            setImportResult(res.data);
            setImportPreview(null);

            const inv = await getInventory();
            setInventory(inv.data);
        } catch (err) {
            setImportError(err.response?.data?.message || "Error al importar el archivo.");
            setImportPreview(null);
        } finally {
            setImportando(false);
        }
    };

    return {
        importPreview, setImportPreview,
        importError, setImportError,
        importResult, setImportResult,
        importando, fileInputRef,
        handleFileChange, confirmarImport
    };
}