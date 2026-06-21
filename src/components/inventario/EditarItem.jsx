import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

import EliminarItem from './EliminarItem';
import SelectCategoria from './SelectCategoria';
import QueryStateManager from "../ui/QueryStateManager";
import Button from "../ui/Button";
import Tooltip from "../ui/Tooltip";
import QRRender from './QRRender';

import { getInventoryItemRequest, updateInventoryItemRequest } from "../../api/inventory.api";
import { validateExtensionGeneration, buildItemPayload } from "../../utils/inventory.utils";

import { DeleteForeverIcon, CommentQuoteIcon } from "../icons"

import { tv } from 'tailwind-variants';

// STYLES
const extensionStyles = tv({
    slots: {
        listContainer: "border border-base-content/10 rounded p-2 bg-base-200 max-h-40 overflow-y-auto",
        listItem: "p-1 flex gap-2 min-h-9 justify-between items-center odd:bg-base-content/5 rounded",
        formCard: "bg-base-200 rounded p-2 border border-base-content/10 flex flex-col gap-1",
        previewCard: "border border-primary/30 rounded p-3 bg-primary/5",
        badge: "badge badge-sm shadow-sm/50 min-w-20"
    },
    variants: {
        status: {
            available: { badge: "badge-success" },
            borrowed: { badge: "badge-error" }
        }
    }
});

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Manages toast notification state and automatic dismissal.
 */
const useToastNotification = () => {
    const [toast, setToastState] = useState(null);

    const showToast = useCallback((type, message, duration = 2500) => {
        setToastState({ type, message });
        setTimeout(() => setToastState(null), duration);
    }, []);

    return { toast, showToast };
};

/**
 * Manages inventory item extensions generation, preview, and removal logic.
 */
const useExtensionManager = (item, setItem, showToast) => {
    const [prefix, setPrefix] = useState("");
    const [from, setFrom] = useState(1);
    const [to, setTo] = useState(1);
    const [generationError, setGenerationError] = useState(null);
    const [preview, setPreview] = useState([]);

    const deleteExtension = useCallback((code) => {
        if (!item?.extensiones) return;

        const extension = item.extensiones.find((e) => e.codigo === code);
        if (!extension) return;

        if (!extension.disponible) {
            showToast("error", `No se puede eliminar "${code}": está prestada.`);
            return;
        }

        setItem((prev) => ({
            ...prev,
            extensiones: prev.extensiones.filter((e) => e.codigo !== code),
        }));
    }, [item, setItem, showToast]);

    const handleGenerate = useCallback(() => {
        if (!item?.extensiones) return;

        const existingCodes = new Set(item.extensiones.map((e) => e.codigo));
        const { error, codes } = validateExtensionGeneration(prefix, from, to, existingCodes);

        if (error) {
            setGenerationError(error);
            return;
        }

        setGenerationError(null);
        setPreview(codes.map((c) => ({ codigo: c, disponible: true, comentario: "" })));
    }, [item, prefix, from, to]);

    const confirmAddExtensions = useCallback(() => {
        if (preview.length === 0) return;

        setItem((prev) => ({
            ...prev,
            extensiones: [...prev.extensiones, ...preview],
        }));

        setPreview([]);
        setPrefix("");
        setFrom(1);
        setTo(1);
        setGenerationError(null);
    }, [preview, setItem]);

    const clearPreview = useCallback(() => {
        setPreview([]);
    }, []);

    return {
        prefix, setPrefix,
        from, setFrom,
        to, setTo,
        generationError,
        preview,
        deleteExtension,
        handleGenerate,
        confirmAddExtensions,
        clearPreview
    };
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FormFields({ item, onChange }) {
    return (
        <>
            <div>
                <label className="block text-sm font-bold mb-1">Nombre</label>
                <input type="text" name="nombre" value={item.nombre} onChange={onChange} className="input input-bordered w-full" />
            </div>

            <div>
                <label className="block text-sm font-bold mb-1">Descripción</label>
                <input type="text" name="descripcion" value={item.descripcion} onChange={onChange} className="input input-bordered w-full" />
            </div>

            <div>
                <label className="block text-sm font-bold mb-1">Categoría</label>
                <SelectCategoria name="categoria" value={item.categoria} onChange={onChange} permitirNuevo={true} className="select select-bordered w-full" />
            </div>

            <div>
                <label className="block text-sm font-bold mb-1">Tipo</label>
                <input type="text" value={item.tipo === "categoria" ? "Categoría (múltiples unidades)" : "Producto Unitario"} disabled className="input input-bordered w-full opacity-70" />
            </div>

            {item.tipo === "unitario" && (
                <div>
                    <label className="block text-sm font-bold mb-1">Stock</label>
                    <input type="number" min="0" name="stock" value={item.stock} onChange={onChange} className="input input-bordered w-full" />
                </div>
            )}
        </>
    );
}

FormFields.propTypes = {
    item: PropTypes.shape({
        nombre: PropTypes.string,
        descripcion: PropTypes.string,
        categoria: PropTypes.string,
        tipo: PropTypes.string,
        stock: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }).isRequired,
    onChange: PropTypes.func.isRequired,
};

function ExtensionSection({ item, extManager }) {
    if (item.tipo !== "categoria") return null;

    const { listContainer, listItem, formCard, previewCard, badge } = extensionStyles();

    return (
        <div className='flex flex-col gap-2'>
            <label className="block text-sm font-bold">Extensiones</label>

            {item.extensiones.length > 0 ? (
                <ul className={listContainer()}>
                    {item.extensiones.map((ext) => (
                        <li key={ext.codigo} className={listItem()}>
                            <div className='pl-2 space-x-2'>
                                <span className="font-mono text-sm">{ext.codigo}</span>
                                <span className={badge({ status: ext.disponible ? "available" : "borrowed" })}>
                                    {ext.disponible ? "Disponible" : "Prestado"}
                                </span>
                            </div>
                            {ext.comentario && (
                                <Tooltip content={ext.comentario}>
                                    <span className="cursor-help">
                                        <CommentQuoteIcon className="size-5 scale-115" />
                                    </span>
                                </Tooltip>
                            )}
                            {ext.disponible && (
                                <Tooltip content="Eliminar">
                                    <Button color="destructive" variant="outline" size="icon" layout="square" type="button" onClick={() => extManager.deleteExtension(ext.codigo)}>
                                        <DeleteForeverIcon />
                                    </Button>
                                </Tooltip>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-base-content/50 mb-4">Sin extensiones registradas.</p>
            )}

            {/* Generator Form */}
            <div className={formCard()}>
                <h3 className="text-sm font-bold">Agregar más extensiones</h3>
                <div className="flex flex-row gap-2">
                    <div className="flex-4">
                        <label className="block text-xs font-semibold mb-1">Prefijo de extensión</label>
                        <input type="text" placeholder="Ej: NBP, RT" value={extManager.prefix} onChange={(e) => extManager.setPrefix(e.target.value.toUpperCase())} className="input input-bordered input-sm w-full font-mono" />
                    </div>

                    <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1">Desde</label>
                        <input type="number" min="1" value={extManager.from} onChange={(e) => extManager.setFrom(parseInt(e.target.value) || 1)} className="input input-bordered input-sm w-full" />
                    </div>

                    <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1">Hasta</label>
                        <input type="number" min="1" value={extManager.to} onChange={(e) => extManager.setTo(parseInt(e.target.value) || 1)} className="input input-bordered input-sm w-full" />
                    </div>
                </div>
                {extManager.generationError && <p className="text-xs text-error mb-2">{extManager.generationError}</p>}
                <button type="button" onClick={extManager.handleGenerate} className="btn btn-sm btn-primary max-w-20 place-self-end">Generar</button>
            </div>

            {/* Preview Section */}
            {extManager.preview.length > 0 && (
                <div className={previewCard()}>
                    <p className="text-xs font-semibold text-primary mb-2">Preview — {extManager.preview.length} nuevas extensiones</p>
                    <ul className="max-h-36 overflow-y-auto mb-3">
                        {extManager.preview.map((ext) => (
                            <li key={ext.codigo} className="flex items-center gap-2 py-0.5">
                                <span className="font-mono text-sm flex-1">{ext.codigo}</span>
                                <span className="badge badge-success badge-sm">Disponible</span>
                            </li>
                        ))}
                    </ul>
                    <div className="flex gap-2">
                        <button type="button" onClick={extManager.confirmAddExtensions} className="btn btn-sm btn-success">Agregar</button>
                        <button type="button" onClick={extManager.clearPreview} className="btn btn-sm btn-ghost">Limpiar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

ExtensionSection.propTypes = {
    item: PropTypes.shape({
        tipo: PropTypes.string.isRequired,
        extensiones: PropTypes.arrayOf(
            PropTypes.shape({
                codigo: PropTypes.string.isRequired,
                disponible: PropTypes.bool.isRequired,
                comentario: PropTypes.string,
            })
        ).isRequired,
    }).isRequired,
    extManager: PropTypes.shape({
        prefix: PropTypes.string.isRequired,
        setPrefix: PropTypes.func.isRequired,
        from: PropTypes.number.isRequired,
        setFrom: PropTypes.func.isRequired,
        to: PropTypes.number.isRequired,
        setTo: PropTypes.func.isRequired,
        generationError: PropTypes.string,
        preview: PropTypes.array.isRequired,
        deleteExtension: PropTypes.func.isRequired,
        handleGenerate: PropTypes.func.isRequired,
        confirmAddExtensions: PropTypes.func.isRequired,
        clearPreview: PropTypes.func.isRequired,
    }).isRequired,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EditarItem({ itemId, onClose }) {
    const [item, setItem] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const { toast, showToast } = useToastNotification();
    const extManager = useExtensionManager(item, setItem, showToast);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        getInventoryItemRequest(itemId)
            .then((res) => {
                if (isMounted) {
                    setItem({
                        ...res.data,
                        extensiones: res.data.extensiones || [],
                    });
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError("Error al cargar los datos del item.");
                    console.error(err);
                }
            })
            .finally(() => setIsLoading(false));

        return () => { isMounted = false; };
    }, [itemId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setItem((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (extManager.preview.length > 0) {
            showToast("warning", 'Hay extensiones generadas sin confirmar. Agrégalas o limpia la vista previa.', 3000);
            return;
        }

        try {
            const payload = buildItemPayload(item);
            await updateInventoryItemRequest(itemId, payload);

            showToast("success", "Item actualizado exitosamente.");
            setTimeout(() => onClose(), 1000);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Error al guardar";
            showToast("error", msg);
        }
    };

    return (
        <QueryStateManager isLoading={!item || isLoading} isError={!!error}>
            {item && (
                <>
                    <div className='flex flex-row gap-2 h-full'>
                        <div className="w-full flex flex-col gap-4">
                            <div>
                                <h2 className="text-2xl font-bold">Editar Item</h2>
                                <p className="text-sm text-base-content/70">Modifica los detalles o gestiona las extensiones.</p>
                            </div>

                            {toast && (
                                <div className={`alert ${toast.type === "success" ? "alert-success" : toast.type === "warning" ? "alert-warning" : "alert-error"} py-2`}>
                                    <span>{toast.message}</span>
                                </div>
                            )}

                            <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
                                <FormFields item={item} onChange={handleChange} />
                                <ExtensionSection item={item} extManager={extManager} />
                            </div>
                        </div>

                        <div className='flex flex-col gap-2 h-full'>
                            <div className='p-2'>
                                <QRRender id={item._id} />
                                <h2 className="text-lg font-mono text-center">{item._id}</h2>
                            </div>
                        </div>
                    </div>
                    <div className="modal-action mt-2 flex justify-between items-center">
                        <EliminarItem id={item._id} onSuccess={onClose} />
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="btn btn-ghost">Cancelar</button>
                            <button onClick={handleSave} className="btn btn-primary">Guardar</button>
                        </div>
                    </div>
                </>
            )}
        </QueryStateManager>
    );
}

EditarItem.propTypes = {
    itemId: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
};