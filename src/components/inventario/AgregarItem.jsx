import { useState } from "react";
import { useNavigate } from "react-router-dom";

import SelectCategoria from "./SelectCategoria";
import { api } from "../../utils";

const RANGO_MAX = 50;

function generarCodigos(prefijo, desde, hasta) {
    const codigos = [];
    for (let i = desde; i <= hasta; i++) {
        codigos.push(`${prefijo}-${String(i).padStart(2, "0")}`);
    }
    return codigos;
}

export default function AgregarItem() {
    const navigate = useNavigate();

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
                setTimeout(() => navigate("/inventario"), 1500);
            })
            .catch((err) => {
                const msg = err.response?.data?.message || "Error al agregar item";
                setToast({ tipo: "error", mensaje: msg });
                setTimeout(() => setToast(null), 2500);
            });
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-5 border rounded shadow-md">
            <h2 className="text-2xl font-bold mb-5">Agregar Item</h2>

            {toast && (
                <div className={`alert ${toast.tipo === "success" ? "alert-success" : "alert-error"} mb-4`}>
                    <span>{toast.mensaje}</span>
                </div>
            )}

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
                <input
                    type="text"
                    placeholder="Nombre"
                    name="nombre"
                    value={newItem.nombre}
                    onChange={handleChange}
                    className="input input-bordered w-full max-w-xs"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Descripción</label>
                <input
                    type="text"
                    placeholder="Descripción"
                    name="descripcion"
                    value={newItem.descripcion}
                    onChange={handleChange}
                    className="input input-bordered w-full max-w-xs"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Categoría</label>
                <SelectCategoria
                    name="categoria"
                    value={newItem.categoria}
                    onChange={handleChange}
                    permitirNuevo={true}
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Tipo</label>
                <select
                    name="tipo"
                    value={newItem.tipo}
                    onChange={(e) => {
                        handleChange(e);
                        setExtensiones([]);
                        setGenError(null);
                    }}
                    className="select select-bordered w-full max-w-xs"
                >
                    <option value="unitario">Producto Unitario</option>
                    <option value="categoria">Categoría (múltiples unidades)</option>
                </select>
            </div>

            {newItem.tipo === "unitario" && (
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Stock</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="Stock"
                        name="stock"
                        value={newItem.stock}
                        onChange={handleChange}
                        className="input input-bordered w-full max-w-xs"
                    />
                </div>
            )}

            {newItem.tipo === "categoria" && (
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Extensiones{extensiones.length > 0 ? ` (${extensiones.length})` : ""}
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                        Stock calculado automáticamente: {extensiones.length}
                    </p>

                    {/* Generator */}
                    <div className="bg-base-200 rounded p-3 mb-3">
                        <div className="mb-2">
                            <label className="block text-xs font-semibold mb-1 text-gray-600">
                                Prefijo de extensión
                            </label>
                            <input
                                type="text"
                                placeholder="Ej: NBP, RT, CALC"
                                value={prefijo}
                                onChange={(e) => setPrefijo(e.target.value.toUpperCase())}
                                className="input input-bordered input-sm w-full max-w-xs font-mono"
                            />
                        </div>

                        <div className="flex gap-3 mb-2">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold mb-1 text-gray-600">Desde</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={desde}
                                    onChange={(e) => setDesde(parseInt(e.target.value) || 1)}
                                    className="input input-bordered input-sm w-full"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold mb-1 text-gray-600">Hasta</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={hasta}
                                    onChange={(e) => setHasta(parseInt(e.target.value) || 1)}
                                    className="input input-bordered input-sm w-full"
                                />
                            </div>
                        </div>

                        {genError && (
                            <p className="text-xs text-error mb-2">{genError}</p>
                        )}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleGenerar}
                                className="btn btn-sm btn-primary"
                            >
                                Generar
                            </button>
                            {extensiones.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleLimpiar}
                                    className="btn btn-sm btn-ghost"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    {extensiones.length > 0 && (
                        <ul className="border rounded p-2 bg-base-100 max-h-48 overflow-y-auto">
                            {extensiones.map((ext) => (
                                <li key={ext.codigo} className="flex items-center gap-2 py-1">
                                    <span className="font-mono text-sm flex-1">{ext.codigo}</span>
                                    <span className="badge badge-success badge-sm">Disponible</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <button
                onClick={handleAddItem}
                className="btn btn-primary btn-xs sm:btn-md lg:btn-lg"
            >
                Agregar
            </button>
        </div>
    );
}
