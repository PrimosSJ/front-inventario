import { useState } from "react";
import PropTypes from "prop-types";
import SelectCategoria from "./SelectCategoria";
import { api } from "../../utils";

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
 * Form component to add a new inventory item. Designed to be embedded within a modal.
 */
export default function AgregarItem({ onClose }) {
    const [newItem, setNewItem] = useState({
        nombre: "",
        descripcion: "",
        categoria: "",
        stock: "",
        tipo: "unitario",
    });

    const [extensiones, setExtensiones] = useState([]);

    // Generator state
    const [prefijo, setPrefijo] = useState("");
    const [desde, setDesde] = useState(1);
    const [hasta, setHasta] = useState(1);
    const [genError, setGenError] = useState(null);

    const [toast, setToast] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewItem((prev) => ({ ...prev, [name]: value }));
    };

    const handleGenerar = () => {
        const p = prefijo.trim();
        if (!p) {
            setGenError("El prefijo no puede estar vacío.");
            return;
        }
        if (desde < 1) {
            setGenError('"Desde" debe ser mayor o igual a 1.');
            return;
        }
        if (hasta < desde) {
            setGenError('"Hasta" debe ser mayor o igual a "Desde".');
            return;
        }
        const cantidad = hasta - desde + 1;
        if (cantidad > RANGO_MAX) {
            setGenError(`El rango máximo permitido es ${RANGO_MAX} extensiones (pediste ${cantidad}).`);
            return;
        }
        setGenError(null);
        const codigos = generarCodigos(p, desde, hasta);
        setExtensiones(codigos.map((c) => ({ codigo: c, disponible: true })));
    };

    const handleLimpiar = () => {
        setExtensiones([]);
        setPrefijo("");
        setDesde(1);
        setHasta(1);
        setGenError(null);
    };

    const handleAddItem = () => {
        const payload = {
            nombre: newItem.nombre,
            descripcion: newItem.descripcion,
            categoria: newItem.categoria,
            tipo: newItem.tipo,
        };

        if (newItem.tipo === "categoria") {
            if (extensiones.length === 0) {
                setToast({ tipo: "error", mensaje: "Debes generar al menos una extensión." });
                setTimeout(() => setToast(null), 2500);
                return;
            }
            payload.extensiones = extensiones;
        } else {
            payload.stock = newItem.stock;
        }

        api
            .post("/inventario", payload)
            .then(() => {
                setToast({ tipo: "success", mensaje: "Item agregado exitosamente" });
                // Let the user see the success message briefly before closing the modal
                setTimeout(() => {
                    onClose();
                }, 1000);
            })
            .catch((err) => {
                const msg = err.response?.data?.message || "Error al agregar item";
                setToast({ tipo: "error", mensaje: msg });
                setTimeout(() => setToast(null), 2500);
            });
    };

    return (
        <div className="w-full flex flex-col gap-4">
            <div>
                <h2 className="text-2xl font-bold">Agregar Item</h2>
                <p className="text-sm text-base-content/70">Registra un nuevo producto en el sistema.</p>
            </div>

            {toast && (
                <div className={`alert ${toast.tipo === "success" ? "alert-success" : "alert-error"} py-2`}>
                    <span>{toast.mensaje}</span>
                </div>
            )}

            <div className="grid gap-3">
                <div>
                    <label className="block text-sm font-bold mb-1">Nombre</label>
                    <input
                        type="text"
                        placeholder="Nombre"
                        name="nombre"
                        value={newItem.nombre}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Descripción</label>
                    <input
                        type="text"
                        placeholder="Descripción"
                        name="descripcion"
                        value={newItem.descripcion}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Categoría</label>
                    <SelectCategoria
                        name="categoria"
                        value={newItem.categoria}
                        onChange={handleChange}
                        permitirNuevo={true}
                        className="select select-bordered w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Tipo</label>
                    <select
                        name="tipo"
                        value={newItem.tipo}
                        onChange={(e) => {
                            handleChange(e);
                            setExtensiones([]);
                            setGenError(null);
                        }}
                        className="select select-bordered w-full"
                    >
                        <option value="unitario">Producto Unitario</option>
                        <option value="categoria">Categoría (múltiples unidades)</option>
                    </select>
                </div>

                {newItem.tipo === "unitario" && (
                    <div>
                        <label className="block text-sm font-bold mb-1">Stock inicial</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="Stock"
                            name="stock"
                            value={newItem.stock}
                            onChange={handleChange}
                            className="input input-bordered w-full"
                        />
                    </div>
                )}

                {newItem.tipo === "categoria" && (
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-bold">
                                Extensiones {extensiones.length > 0 && `(${extensiones.length})`}
                            </label>
                        </div>

                        {/* Generator */}
                        <div className="bg-base-200 rounded p-3 mb-3 border border-base-300">
                            <div className="mb-2">
                                <label className="block text-xs font-semibold mb-1">Prefijo de extensión</label>
                                <input
                                    type="text"
                                    placeholder="Ej: NBP, RT, CALC"
                                    value={prefijo}
                                    onChange={(e) => setPrefijo(e.target.value.toUpperCase())}
                                    className="input input-bordered input-sm w-full font-mono"
                                />
                            </div>

                            <div className="flex gap-3 mb-2">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold mb-1">Desde</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={desde}
                                        onChange={(e) => setDesde(parseInt(e.target.value) || 1)}
                                        className="input input-bordered input-sm w-full"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold mb-1">Hasta</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={hasta}
                                        onChange={(e) => setHasta(parseInt(e.target.value) || 1)}
                                        className="input input-bordered input-sm w-full"
                                    />
                                </div>
                            </div>

                            {genError && <p className="text-xs text-error mb-2">{genError}</p>}

                            <div className="flex gap-2 mt-3">
                                <button type="button" onClick={handleGenerar} className="btn btn-sm btn-primary">
                                    Generar
                                </button>
                                {extensiones.length > 0 && (
                                    <button type="button" onClick={handleLimpiar} className="btn btn-sm btn-ghost">
                                        Limpiar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Preview */}
                        {extensiones.length > 0 && (
                            <ul className="border border-base-300 rounded p-2 bg-base-100 max-h-40 overflow-y-auto">
                                {extensiones.map((ext) => (
                                    <li key={ext.codigo} className="flex items-center gap-2 py-1 border-b border-base-200 last:border-0">
                                        <span className="font-mono text-sm flex-1">{ext.codigo}</span>
                                        <span className="badge badge-success badge-sm">Disponible</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            <div className="modal-action mt-2">
                <button type="button" onClick={onClose} className="btn btn-ghost">
                    Cancelar
                </button>
                <button onClick={handleAddItem} className="btn btn-primary">
                    Guardar Item
                </button>
            </div>
        </div>
    );
}

AgregarItem.propTypes = {
    onClose: PropTypes.func.isRequired,
};