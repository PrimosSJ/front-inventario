import { useEffect, useState, Fragment, useRef } from "react";
import io from "socket.io-client";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";

import SelectCategoria from "./inventario/SelectCategoria";

import url, { api } from "../utils";

const socket = io(url);

function fechaHoy() {
    return new Date().toISOString().slice(0, 10);
}

function exportarExcel(inventory) {
    const rows = inventory.map((item) => ({
        Nombre: item.nombre,
        Descripción: item.descripcion,
        Categoría: item.categoria,
        Tipo: item.tipo === "categoria" ? "categoría" : "unitario",
        "Tipo Préstamo": item.tipo_prestamo === "especial" ? "especial" : "público",
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

function parsearExcel(file) {
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
                    tipo_prestamo: String(row["Tipo Préstamo"] || "público").trim().toLowerCase() === "especial" ? "especial" : "publico",
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

export default function Inventario() {
    const [inventory, setInventory] = useState([]);
    const [expandidos, setExpandidos] = useState({});
    const [nombreFiltro, setNombreFiltro] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("");

    const [importPreview, setImportPreview] = useState(null);
    const [importError, setImportError] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [importando, setImportando] = useState(false);
    const fileInputRef = useRef(null);

    const filteredInventory = (inventory || []).filter((item) => {
        const nombreMatch = item.nombre.toLowerCase().includes(nombreFiltro.toLowerCase());
        const categoriaMatch = categoriaFiltro === "" || item.categoria === categoriaFiltro;
        return nombreMatch && categoriaMatch;
    });

    useEffect(() => {
        api
            .get("/inventario")
            .then((res) => setInventory(res.data))
            .catch((err) => console.log(err));

        socket.on("inventoryUpdate", (data) => setInventory(data));
        return () => socket.off("inventoryUpdate");
    }, []);

    const toggleExpand = (id) => {
        setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const renderTipoPrestamoBadge = (tipoPrestamo) => {
        if (tipoPrestamo === "especial") {
            return <span className="badge badge-warning">Especial</span>;
        }
        return <span className="badge badge-ghost">Público</span>;
    };

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
            const res = await api.post("/inventario/bulk", { items: importPreview });
            setImportResult(res.data);
            setImportPreview(null);
            // Reload inventory
            const inv = await api.get("/inventario");
            setInventory(inv.data);
        } catch (err) {
            setImportError(err.response?.data?.message || "Error al importar");
            setImportPreview(null);
        } finally {
            setImportando(false);
        }
    };

    return (
        <>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-center">Inventario</h1>

                {importError && (
                    <div className="alert alert-error mb-4">
                        <span>{importError}</span>
                        <button className="btn btn-xs btn-ghost ml-auto" onClick={() => setImportError(null)}>✕</button>
                    </div>
                )}

                {importResult && (
                    <div className={`alert ${importResult.errores > 0 ? "alert-warning" : "alert-success"} mb-4`}>
                        <div>
                            <p>Se importaron <strong>{importResult.creados}</strong> de <strong>{importResult.total}</strong> items. {importResult.errores > 0 && <span>{importResult.errores} errores.</span>}</p>
                            {importResult.detalle_errores?.length > 0 && (
                                <ul className="text-xs mt-1 list-disc list-inside">
                                    {importResult.detalle_errores.map((e, i) => (
                                        <li key={i}>Fila {e.fila} ({e.nombre}): {e.error}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button className="btn btn-xs btn-ghost ml-auto" onClick={() => setImportResult(null)}>✕</button>
                    </div>
                )}

                <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                        <input
                            type="text"
                            placeholder="Buscar por nombre"
                            className="input input-bordered w-full max-w-xs"
                            value={nombreFiltro}
                            onChange={(e) => setNombreFiltro(e.target.value)}
                        />
                        <SelectCategoria
                            value={categoriaFiltro}
                            onChange={(e) => setCategoriaFiltro(e.target.value)}
                            className="select select-bordered w-full max-w-xs"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 mb-4">
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => exportarExcel(inventory)}
                        disabled={inventory.length === 0}
                    >
                        ↓ Exportar Excel
                    </button>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        ↑ Importar Excel
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Link to="/inventario/agregar" className="btn btn-primary btn-sm">
                        + Agregar Item
                    </Link>
                </div>

                {/* Import Preview Modal */}
                {importPreview && (
                    <div className="modal modal-open">
                        <div className="modal-box max-w-2xl">
                            <h3 className="font-bold text-lg mb-2">
                                Vista previa — {importPreview.length} items a importar
                            </h3>
                            <div className="overflow-x-auto max-h-64">
                                <table className="table table-sm w-full">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Categoría</th>
                                            <th>Tipo</th>
                                            <th>Tipo Préstamo</th>
                                            <th>Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importPreview.map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.nombre || <span className="text-error">vacío</span>}</td>
                                                <td>{item.categoria}</td>
                                                <td>{item.tipo}</td>
                                                <td>{item.tipo_prestamo}</td>
                                                <td>{item.stock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="modal-action">
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setImportPreview(null)}
                                    disabled={importando}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={confirmarImport}
                                    disabled={importando}
                                >
                                    {importando ? "Importando..." : `Confirmar ${importPreview.length} items`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th className="text-left w-8"></th>
                                <th className="text-left">Nombre</th>
                                <th className="text-left">Descripción</th>
                                <th className="text-left">Categoría</th>
                                <th className="text-left">Tipo</th>
                                <th className="text-left">Tipo Préstamo</th>
                                <th className="text-center">Disponible</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInventory.map((item) => {
                                const esCategoria = item.tipo === "categoria";
                                const expandido = !!expandidos[item._id];
                                const disponibles = esCategoria
                                    ? (item.extensiones || []).filter((e) => e.disponible).length
                                    : item.stock;

                                return (
                                    <Fragment key={item._id}>
                                        <tr
                                            className={esCategoria ? "cursor-pointer hover" : ""}
                                            onClick={esCategoria ? () => toggleExpand(item._id) : undefined}
                                        >
                                            <td className="text-center">
                                                {esCategoria ? (
                                                    <span className="text-lg select-none">
                                                        {expandido ? "▼" : "▶"}
                                                    </span>
                                                ) : null}
                                            </td>
                                            <td>{item.nombre}</td>
                                            <td>{item.descripcion}</td>
                                            <td>{item.categoria}</td>
                                            <td>
                                                {esCategoria ? (
                                                    <span className="badge badge-info">Categoría</span>
                                                ) : (
                                                    <span className="badge">Unitario</span>
                                                )}
                                            </td>
                                            <td>{renderTipoPrestamoBadge(item.tipo_prestamo)}</td>
                                            <td className="text-right">
                                                {esCategoria
                                                    ? `${disponibles} / ${(item.extensiones || []).length}`
                                                    : item.stock}
                                            </td>
                                            <td className="text-center">
                                                <div
                                                    className="flex justify-center items-center gap-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Link
                                                        to={`/inventario/${item._id}`}
                                                        className="btn btn-ghost btn-sm"
                                                    >
                                                        Editar
                                                    </Link>

                                                    {disponibles > 0 ? (
                                                        <Link
                                                            to={`/new_prestamo/${item._id}`}
                                                            className="btn btn-accent btn-sm"
                                                            title={
                                                                esCategoria
                                                                    ? "Prestar una unidad específica"
                                                                    : "Prestar"
                                                            }
                                                        >
                                                            {esCategoria ? "Prestar unidad" : "Prestar"}
                                                        </Link>
                                                    ) : (
                                                        <span className="badge badge-error text-white whitespace-nowrap">
                                                            Sin Stock
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>

                                        {esCategoria && expandido && (
                                            <tr key={`${item._id}-ext`}>
                                                <td colSpan={8} className="p-0">
                                                    <div className="bg-base-200 pl-12 pr-4 py-3">
                                                        <p className="font-semibold text-sm mb-2">Extensiones:</p>
                                                        {(item.extensiones || []).length === 0 ? (
                                                            <p className="text-sm text-gray-500">
                                                                Sin extensiones registradas.
                                                            </p>
                                                        ) : (
                                                            <table className="table table-sm w-full bg-base-300 rounded">
                                                                <thead>
                                                                    <tr>
                                                                        <th className="text-left">Código</th>
                                                                        <th className="text-left">Estado</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {(item.extensiones || []).map((ext) => (
                                                                        <tr key={ext.codigo}>
                                                                            <td className="font-mono text-sm">{ext.codigo}</td>
                                                                            <td>
                                                                                {ext.disponible ? (
                                                                                    <span className="badge badge-success badge-sm">Disponible</span>
                                                                                ) : (
                                                                                    <span className="badge badge-error badge-sm">Prestado</span>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
