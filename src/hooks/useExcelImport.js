import { useState, useRef } from "react";
import { parsearExcel } from "../services/excel.service";
import { bulkImportInventoryRequest, getInventoryRequest } from "../api/inventory.api";

/**
 * Hook to handle the flow of parsing and bulk-importing Excel data.
 */
export function useExcelImport(setInventory) {
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
            const res = await bulkImportInventoryRequest(importPreview);
            setImportResult(res.data);
            setImportPreview(null);

            // Refresh inventory strictly upon success
            const inv = await getInventoryRequest();
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