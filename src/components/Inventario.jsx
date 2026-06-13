import { useEffect, useState, Fragment, useRef } from "react";
import io from "socket.io-client";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

import SelectCategoria from "./inventario/SelectCategoria";
import url, { api } from "../utils";
import { exportarExcel, parsearExcel } from "../services/excel.service";
import AgregarItem from "./inventario/AgregarItem";

import DownloadIcon from "./icons/download"
import UploadIcon from "./icons/upload"
import CommentIcon from "./icons/comment";
import AddIcon from "./icons/add";

const socket = io(url);

// ==========================================
// CUSTOM HOOKS
// ==========================================

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

// ==========================================
// SUB-COMPONENTES DE PRESENTACIÓN
// ==========================================

const ImportPreviewModal = ({ importPreview, importando, onCancel, onConfirm }) => {
    if (!importPreview) return null;

    return (
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
                    <button className="btn btn-ghost" onClick={onCancel} disabled={importando}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={onConfirm} disabled={importando}>
                        {importando ? "Importando..." : `Confirmar ${importPreview.length} items`}
                    </button>
                </div>
            </div>
        </div>
    );
};

ImportPreviewModal.propTypes = {
    importPreview: PropTypes.array,
    importando: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
};

const CommentModal = ({ modalExt, modalComentario, guardandoComentario, setModalComentario, onCancel, onConfirm }) => {
    if (!modalExt) return null;

    return (
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
                    <button className="btn btn-ghost" onClick={onCancel} disabled={guardandoComentario}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={onConfirm} disabled={guardandoComentario}>
                        {guardandoComentario ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </div>
        </div>
    );
};

CommentModal.propTypes = {
    modalExt: PropTypes.shape({
        itemId: PropTypes.string,
        codigo: PropTypes.string,
    }),
    modalComentario: PropTypes.string.isRequired,
    guardandoComentario: PropTypes.bool.isRequired,
    setModalComentario: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
};

const InventoryRow = ({ item, expandido, onToggleExpand, onOpenCommentModal }) => {
    const esCategoria = item.tipo === "categoria";
    const disponibles = esCategoria
        ? (item.extensiones || []).filter((e) => e.disponible).length
        : item.stock;

    return (
        <Fragment>
            <tr
                className={esCategoria ? "cursor-pointer hover" : ""}
                onClick={esCategoria ? () => onToggleExpand(item._id) : undefined}
            >
                <td className="text-center">
                    {esCategoria && <span className="text-lg select-none">{expandido ? "▼" : "▶"}</span>}
                </td>
                <td>{item.nombre}</td>
                <td>{item.descripcion}</td>
                <td>{item.categoria}</td>
                <td>
                    {esCategoria ? <span className="badge badge-info">Categoría</span> : <span className="badge">Unitario</span>}
                </td>
                <td className="text-right">
                    {esCategoria ? `${disponibles} / ${(item.extensiones || []).length}` : item.stock}
                </td>
                <td className="text-center">
                    <div className="flex justify-center items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link to={`/inventario/${item._id}`} className="btn btn-ghost btn-sm">Editar</Link>
                        {disponibles > 0 ? (
                            <Link
                                to={`/new_prestamo/${item._id}`}
                                className="btn btn-accent btn-sm"
                                title={esCategoria ? "Prestar una unidad específica" : "Prestar"}
                            >
                                {esCategoria ? "Prestar unidad" : "Prestar"}
                            </Link>
                        ) : (
                            <span className="badge badge-error text-white whitespace-nowrap">Sin Stock</span>
                        )}
                    </div>
                </td>
            </tr>

            {esCategoria && expandido && (
                <tr>
                    <td colSpan={7} className="p-0">
                        <div className="bg-base-200 pl-12 pr-4 py-3">
                            <p className="font-semibold text-sm mb-2">Extensiones:</p>
                            {(item.extensiones || []).length === 0 ? (
                                <p className="text-sm text-gray-500">Sin extensiones registradas.</p>
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
                                                                onOpenCommentModal(item._id, ext.codigo, ext.comentario);
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
};

InventoryRow.propTypes = {
    item: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        nombre: PropTypes.string.isRequired,
        descripcion: PropTypes.string,
        categoria: PropTypes.string,
        tipo: PropTypes.string.isRequired,
        stock: PropTypes.number,
        extensiones: PropTypes.array,
    }).isRequired,
    expandido: PropTypes.bool.isRequired,
    onToggleExpand: PropTypes.func.isRequired,
    onOpenCommentModal: PropTypes.func.isRequired,
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function Inventario() {
    const {
        inventory, setInventory, expandidos, toggleExpand,
        nombreFiltro, setNombreFiltro, categoriaFiltro, setCategoriaFiltro, filteredInventory
    } = useInventoryData();

    const {
        importPreview, setImportPreview, importError, setImportError, importResult, setImportResult,
        importando, fileInputRef, handleFileChange, confirmarImport
    } = useExcelImport(setInventory);

    const {
        modalExt, setModalExt, modalComentario, setModalComentario,
        guardandoComentario, handleGuardarComentario
    } = useExtensionComments(setInventory);

    const [showAddModal, setShowAddModal] = useState(false);

    return (
        <div className="container mx-auto p-4 space-y-2">
            <h1 className="text-2xl font-bold mb-4">Inventario</h1>

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

            <div className="mb-4 flex flex-wrap gap-2">
                <label className="input input-sm input-bordered max-w-sm w-full items-center gap-2 flex flex-row">
                    <svg className="h-[1em] opacity-50 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <g
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            strokeWidth="2.5"
                            fill="none"
                            stroke="currentColor"
                        >
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.3-4.3"></path>
                        </g>
                    </svg>
                    <input type="search" className="grow" required placeholder="Buscar por nombre" value={nombreFiltro} onChange={(e) => setNombreFiltro(e.target.value)} />
                </label>

                <SelectCategoria
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="select select-bordered select-sm w-full max-w-xs"
                />

                <div className="ml-auto right-0 flex gap-2">
                    <button className="btn btn-outline btn-sm" onClick={() => exportarExcel(inventory)} disabled={inventory.length === 0}>
                        <DownloadIcon />
                        <span>Exportar Excel</span>
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
                        <UploadIcon />
                        <span>Importar Excel</span>
                    </button>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
                        <AddIcon />
                        <span>Agregar Item</span>
                    </button>
                </div>
            </div>

            {showAddModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <AgregarItem onClose={() => setShowAddModal(false)} />
                    </div>
                </div>
            )}

            <ImportPreviewModal
                importPreview={importPreview}
                importando={importando}
                onCancel={() => setImportPreview(null)}
                onConfirm={confirmarImport}
            />

            <CommentModal
                modalExt={modalExt}
                modalComentario={modalComentario}
                guardandoComentario={guardandoComentario}
                setModalComentario={setModalComentario}
                onCancel={() => { setModalExt(null); setModalComentario(""); }}
                onConfirm={handleGuardarComentario}
            />

            <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
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
                        {filteredInventory.map((item) => (
                            <InventoryRow
                                key={item._id}
                                item={item}
                                expandido={!!expandidos[item._id]}
                                onToggleExpand={toggleExpand}
                                onOpenCommentModal={(itemId, codigo, comentarioActual) => {
                                    setModalExt({ itemId, codigo });
                                    setModalComentario(comentarioActual || "");
                                }}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}