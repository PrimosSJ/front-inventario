import { useEffect, useState, Fragment, useRef } from "react";
import io from "socket.io-client";
import { Link } from "react-router-dom";

import SelectCategoria from "./inventario/SelectCategoria";
import url, { api } from "../utils";
import { exportarExcel, parsearExcel } from "../services/excel.service";

import CommentIcon from "./icons/comment"

const socket = io(url);

// --- Custom Hooks for Logic Separation ---

function useInventoryData() {
    const [inventory, setInventory] = useState([]);
    const [expandidos, setExpandidos] = useState({});
    const [nombreFiltro, setNombreFiltro] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("");

    useEffect(() => {
        api.get("/inventario")
            .then((res) => setInventory(res.data))
            .catch((err) => console.log(err));

        socket.on("inventoryUpdate", (data) => setInventory(data));
        return () => socket.off("inventoryUpdate");
    }, []);

    const toggleExpand = (id) => {
        setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredInventory = (inventory || []).filter((item) => {
        const nombreMatch = item.nombre.toLowerCase().includes(nombreFiltro.toLowerCase());
        const categoriaMatch = categoriaFiltro === "" || item.categoria === categoriaFiltro;
        return nombreMatch && categoriaMatch;
    });

    return {
        inventory, setInventory,
        expandidos, toggleExpand,
        nombreFiltro, setNombreFiltro,
        categoriaFiltro, setCategoriaFiltro,
        filteredInventory
    };
}

function useExcelImport(setInventory) {
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
            const res = await api.post("/inventario/bulk", { items: importPreview });
            setImportResult(res.data);
            setImportPreview(null);
            const inv = await api.get("/inventario");
            setInventory(inv.data);
        } catch (err) {
            setImportError(err.response?.data?.message || "Error al importar");
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

function useExtensionComments(setInventory) {
    const [modalExt, setModalExt] = useState(null); // { itemId, codigo }
    const [modalComentario, setModalComentario] = useState("");
    const [guardandoComentario, setGuardandoComentario] = useState(false);

    const handleGuardarComentario = async () => {
        if (!modalExt) return;
        setGuardandoComentario(true);
        try {
            await api.patch(
                `/inventario/${modalExt.itemId}/extensiones/${modalExt.codigo}/comentario`,
                { comentario: modalComentario }
            );
            setInventory((prev) =>
                prev.map((item) => {
                    if (item._id !== modalExt.itemId) return item;
                    return {
                        ...item,
                        extensiones: item.extensiones.map((ext) =>
                            ext.codigo === modalExt.codigo
                                ? { ...ext, comentario: modalComentario }
                                : ext
                        ),
                    };
                })
            );
            setModalExt(null);
            setModalComentario("");
        } catch (err) {
            console.error("Error al guardar comentario:", err);
        } finally {
            setGuardandoComentario(false);
        }
    };

    return {
        modalExt, setModalExt,
        modalComentario, setModalComentario,
        guardandoComentario, handleGuardarComentario
    };
}

// --- Main Component ---
export default function Inventario() {
    // 1. Base Data Logic
    const {
        inventory, setInventory, expandidos, toggleExpand,
        nombreFiltro, setNombreFiltro, categoriaFiltro, setCategoriaFiltro, filteredInventory
    } = useInventoryData();

    // 2. Excel Import Logic
    const {
        importPreview, setImportPreview, importError, setImportError, importResult, setImportResult,
        importando, fileInputRef, handleFileChange, confirmarImport
    } = useExcelImport(setInventory);

    // 3. Comments Logic
    const {
        modalExt, setModalExt, modalComentario, setModalComentario,
        guardandoComentario, handleGuardarComentario
    } = useExtensionComments(setInventory);

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
                                            <th>Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {importPreview.map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.nombre || <span className="text-error">vacío</span>}</td>
                                                <td>{item.categoria}</td>
                                                <td>{item.tipo}</td>
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

                {/* Extension comment modal */}
                {modalExt && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg mb-4 font-mono">{modalExt.codigo}</h3>
                            <textarea
                                className="textarea textarea-bordered w-full"
                                placeholder="Observación sobre esta extensión..."
                                value={modalComentario}
                                onChange={(e) => setModalComentario(e.target.value)}
                                rows={3}
                            />
                            <div className="modal-action">
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => { setModalExt(null); setModalComentario(""); }}
                                    disabled={guardandoComentario}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleGuardarComentario}
                                    disabled={guardandoComentario}
                                >
                                    {guardandoComentario ? "Guardando..." : "Guardar"}
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
                                                <td colSpan={7} className="p-0">
                                                    <div className="bg-base-200 pl-12 pr-4 py-3">
                                                        <p className="font-semibold text-sm mb-2">Extensiones:</p>
                                                        {(item.extensiones || []).length === 0 ? (
                                                            <p className="text-sm text-gray-500">
                                                                Sin extensiones registradas.
                                                            </p>
                                                        ) : (
                                                            <table className="table table-sm table-fixed w-full bg-base-300 rounded">
                                                                <colgroup>
                                                                    <col className="w-48" />
                                                                    <col className="w-40" />
                                                                    <col />
                                                                </colgroup>
                                                                <thead>
                                                                    <tr>
                                                                        <th className="text-left">Código</th>
                                                                        <th className="text-left">Estado</th>
                                                                        <th className="text-left">Comentario</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {(item.extensiones || []).map((ext) => (
                                                                        <tr key={ext.codigo}>
                                                                            <td className="font-mono text-sm py-2 px-3">{ext.codigo}</td>
                                                                            <td className="py-2 px-3">
                                                                                {ext.disponible ? (
                                                                                    <span className="badge badge-success badge-sm">Disponible</span>
                                                                                ) : (
                                                                                    <span className="badge badge-error badge-sm">Prestado</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="py-2 px-3">
                                                                                <div className="flex justify-start">
                                                                                    <div
                                                                                        className={`tooltip tooltip-left cursor-pointer ${ext.comentario ? "text-warning" : "text-base-content/50 hover:text-info"}`}
                                                                                        data-tip={ext.comentario || "Agregar comentario"}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setModalExt({ itemId: item._id, codigo: ext.codigo });
                                                                                            setModalComentario(ext.comentario || "");
                                                                                        }}
                                                                                    >
                                                                                        <CommentIcon />
                                                                                    </div>
                                                                                </div>
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
