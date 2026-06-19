import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import EliminarItem from './EliminarItem';
import QRgenerator from './QRgenerator';
import SelectCategoria from './SelectCategoria';

import { getInventoryItemRequest, updateInventoryItemRequest } from "../../api/inventory.api";

const RANGO_MAX = 50;

/**
 * Generates an array of formatted extension codes.
 */
function generarCodigos(prefijo, desde, hasta) {
    const codigos = [];
    for (let i = desde; i <= hasta; i++) {
        codigos.push(`${prefijo}-${String(i).padStart(2, "0")}`);
    }
    return codigos;
}

/**
 * Modal-ready form component to edit an existing inventory item.
 */
export default function EditarItem({ itemId, onClose }) {
    const [item, setItem] = useState(null);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    // Generator state for adding new extensions
    const [prefijo, setPrefijo] = useState("");
    const [desde, setDesde] = useState(1);
    const [hasta, setHasta] = useState(1);
    const [genError, setGenError] = useState(null);
    const [preview, setPreview] = useState([]);

    useEffect(() => {
        getInventoryItemRequest(itemId)
            .then((res) => {
                setItem({
                    ...res.data,
                    extensiones: res.data.extensiones || [],
                });
            })
            .catch((err) => {
                setError("Error al cargar los datos del item.");
                console.error(err);
            });
    }, [itemId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setItem((prev) => ({ ...prev, [name]: value }));
    };

    const eliminarExtension = (codigo) => {
        const ext = item.extensiones.find((e) => e.codigo === codigo);
        if (!ext) return;
        if (!ext.disponible) {
            setToast({ tipo: "error", mensaje: `No se puede eliminar "${codigo}": está prestada.` });
            setTimeout(() => setToast(null), 2500);
            return;
        }
        setItem((prev) => ({
            ...prev,
            extensiones: prev.extensiones.filter((e) => e.codigo !== codigo),
        }));
    };

    const handleGenerar = () => {
        const p = prefijo.trim();
        if (!p) { setGenError("El prefijo no puede estar vacío."); return; }
        if (desde < 1) { setGenError('"Desde" debe ser mayor o igual a 1.'); return; }
        if (hasta < desde) { setGenError('"Hasta" debe ser mayor o igual a "Desde".'); return; }

        const cantidad = hasta - desde + 1;
        if (cantidad > RANGO_MAX) {
            setGenError(`Rango máximo: ${RANGO_MAX} (pediste ${cantidad}).`);
            return;
        }

        const nuevos = generarCodigos(p, desde, hasta);
        const codigosExistentes = new Set(item.extensiones.map((e) => e.codigo));
        const colisiones = nuevos.filter((c) => codigosExistentes.has(c));

        if (colisiones.length > 0) {
            setGenError(`Código(s) ya existente(s): ${colisiones.join(", ")}`);
            return;
        }

        setGenError(null);
        setPreview(nuevos.map((c) => ({ codigo: c, disponible: true, comentario: "" })));
    };

    const confirmarAgregarExtensiones = () => {
        if (preview.length === 0) return;
        setItem((prev) => ({
            ...prev,
            extensiones: [...prev.extensiones, ...preview],
        }));
        setPreview([]);
        setPrefijo("");
        setDesde(1);
        setHasta(1);
        setGenError(null);
    };

    const handleSave = () => {
        if (preview.length > 0) {
            setToast({ tipo: "warning", mensaje: 'Hay extensiones generadas sin confirmar. Agrégalas o limpia la vista previa.' });
            setTimeout(() => setToast(null), 3000);
            return;
        }

        const payload = {
            nombre: item.nombre,
            descripcion: item.descripcion,
            categoria: item.categoria,
            tipo: item.tipo,
        };

        if (item.tipo === "categoria") {
            payload.extensiones = item.extensiones;
        } else {
            payload.stock = item.stock;
        }

        updateInventoryItemRequest(itemId, payload)
            .then(() => {
                setToast({ tipo: "success", mensaje: "Item actualizado exitosamente." });
                setTimeout(() => onClose(), 1000);
            })
            .catch((err) => {
                const msg = err.response?.data?.message || "Error al guardar";
                setToast({ tipo: "error", mensaje: msg });
                setTimeout(() => setToast(null), 2500);
            });
    };

    if (error && !item) {
        return (
            <div className="w-full flex flex-col items-center justify-center p-8 gap-4">
                <p className="text-error font-bold">{error}</p>
                <button onClick={onClose} className="btn">Cerrar</button>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="w-full flex justify-center p-8">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-4">
            <div>
                <h2 className="text-2xl font-bold">Editar Item</h2>
                <p className="text-sm text-base-content/70">Modifica los detalles o gestiona las extensiones.</p>
            </div>

            {toast && (
                <div className={`alert ${toast.tipo === "success" ? "alert-success" : toast.tipo === "warning" ? "alert-warning" : "alert-error"} py-2`}>
                    <span>{toast.mensaje}</span>
                </div>
            )}

            <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                    <label className="block text-sm font-bold mb-1">Nombre</label>
                    <input type="text" name="nombre" value={item.nombre} onChange={handleChange} className="input input-bordered w-full" />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Descripción</label>
                    <input type="text" name="descripcion" value={item.descripcion} onChange={handleChange} className="input input-bordered w-full" />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Categoría</label>
                    <SelectCategoria name="categoria" value={item.categoria} onChange={handleChange} permitirNuevo={true} className="select select-bordered w-full" />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Tipo</label>
                    <input type="text" value={item.tipo === "categoria" ? "Categoría (múltiples unidades)" : "Producto Unitario"} disabled className="input input-bordered w-full opacity-70" />
                </div>

                {item.tipo === "unitario" && (
                    <div>
                        <label className="block text-sm font-bold mb-1">Stock</label>
                        <input type="number" min="0" name="stock" value={item.stock} onChange={handleChange} className="input input-bordered w-full" />
                    </div>
                )}

                {item.tipo === "categoria" && (
                    <div>
                        <label className="block text-sm font-bold mb-2">Extensiones ({item.extensiones.length})</label>

                        {item.extensiones.length > 0 ? (
                            <ul className="border border-base-300 rounded p-2 bg-base-200 mb-4 max-h-40 overflow-y-auto">
                                {item.extensiones.map((ext) => (
                                    <li key={ext.codigo} className="flex justify-between items-center py-1 border-b border-base-content/5 last:border-0">
                                        <div className="flex flex-col gap-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm">{ext.codigo}</span>
                                                {ext.disponible ? (
                                                    <span className="badge badge-success badge-sm shadow-sm/50">Disponible</span>
                                                ) : (
                                                    <span className="badge badge-error badge-sm shadow-sm/50">Prestado</span>
                                                )}
                                            </div>
                                            {ext.comentario && <span className="text-xs text-base-content/50">{ext.comentario}</span>}
                                        </div>
                                        {ext.disponible && (
                                            <button type="button" onClick={() => eliminarExtension(ext.codigo)} className="btn btn-xs btn-error btn-outline">
                                                Eliminar
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-base-content/50 mb-4">Sin extensiones registradas.</p>
                        )}

                        {/* Generator */}
                        <div className="bg-base-200 rounded p-3 mb-3 border border-base-300">
                            <h3 className="text-sm font-bold mb-3">Agregar más extensiones</h3>
                            <div className="mb-2">
                                <label className="block text-xs font-semibold mb-1">Prefijo de extensión</label>
                                <input type="text" placeholder="Ej: NBP, RT" value={prefijo} onChange={(e) => setPrefijo(e.target.value.toUpperCase())} className="input input-bordered input-sm w-full font-mono" />
                            </div>
                            <div className="flex gap-3 mb-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold mb-1">Desde</label>
                                    <input type="number" min="1" value={desde} onChange={(e) => setDesde(parseInt(e.target.value) || 1)} className="input input-bordered input-sm w-full" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold mb-1">Hasta</label>
                                    <input type="number" min="1" value={hasta} onChange={(e) => setHasta(parseInt(e.target.value) || 1)} className="input input-bordered input-sm w-full" />
                                </div>
                            </div>
                            {genError && <p className="text-xs text-error mb-2">{genError}</p>}
                            <button type="button" onClick={handleGenerar} className="btn btn-sm btn-primary">Generar</button>
                        </div>

                        {/* Preview */}
                        {preview.length > 0 && (
                            <div className="mt-3 border border-info/30 rounded p-3 bg-info/5">
                                <p className="text-xs font-semibold text-info mb-2">Preview — {preview.length} nuevas extensiones</p>
                                <ul className="max-h-36 overflow-y-auto mb-3">
                                    {preview.map((ext) => (
                                        <li key={ext.codigo} className="flex items-center gap-2 py-0.5">
                                            <span className="font-mono text-sm flex-1">{ext.codigo}</span>
                                            <span className="badge badge-success badge-sm">Disponible</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex gap-2">
                                    <button type="button" onClick={confirmarAgregarExtensiones} className="btn btn-sm btn-success">Agregar</button>
                                    <button type="button" onClick={() => setPreview([])} className="btn btn-sm btn-ghost">Limpiar</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <details className="collapse collapse-arrow bg-base-200 border border-base-300 mt-2">
                    <summary className="collapse-title text-sm font-medium">Ver Código QR</summary>
                    <div className="collapse-content flex justify-center">
                        <QRgenerator id={item._id} />
                    </div>
                </details>
            </div>

            <div className="modal-action mt-2 flex justify-between items-center border-t border-base-content/10 pt-4">
                <EliminarItem id={item._id} onSuccess={onClose} />
                <div className="flex gap-2">
                    <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
                    <button onClick={handleSave} className="btn btn-primary">Guardar</button>
                </div>
            </div>
        </div>
    );
}

EditarItem.propTypes = {
    itemId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
};