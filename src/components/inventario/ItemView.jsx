import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import EliminarItem from './EliminarItem';
import QRgenerator from './QRgenerator';
import SelectCategoria from './SelectCategoria';

import { api } from '../../utils';

const RANGO_MAX = 50;

function generarCodigos(prefijo, desde, hasta) {
    const codigos = [];
    for (let i = desde; i <= hasta; i++) {
        codigos.push(`${prefijo}-${String(i).padStart(2, "0")}`);
    }
    return codigos;
}

export default function ItemView() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [item, setItem] = useState(null);
    const [error, setError] = useState(null);

    // Generator state (for adding new extensions)
    const [prefijo, setPrefijo] = useState("");
    const [desde, setDesde] = useState(1);
    const [hasta, setHasta] = useState(1);
    const [genError, setGenError] = useState(null);
    const [preview, setPreview] = useState([]);

    useEffect(() => {
        api
            .get(`/inventario/${id}`)
            .then((res) => {
                setItem({
                    ...res.data,
                    extensiones: res.data.extensiones || [],
                });
            })
            .catch((err) => {
                console.log(err);
            });
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setItem((prev) => ({ ...prev, [name]: value }));
    };

    const eliminarExtension = (codigo) => {
        const ext = item.extensiones.find((e) => e.codigo === codigo);
        if (!ext) return;
        if (!ext.disponible) {
            setError(`No se puede eliminar "${codigo}": está actualmente prestada.`);
            setTimeout(() => setError(null), 2500);
            return;
        }
        setItem((prev) => ({
            ...prev,
            extensiones: prev.extensiones.filter((e) => e.codigo !== codigo),
        }));
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

    const handleLimpiarPreview = () => {
        setPreview([]);
        setPrefijo("");
        setDesde(1);
        setHasta(1);
        setGenError(null);
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
            setError('Hay extensiones en preview sin confirmar. Presiona "Agregar X extensiones" o "Limpiar" antes de guardar.');
            setTimeout(() => setError(null), 3000);
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

        api
            .put(`/inventario/${id}`, payload)
            .then(() => {
                navigate('/inventario');
            })
            .catch((err) => {
                console.log(err);
                setError(err.response?.data?.message || "Error al guardar");
                setTimeout(() => setError(null), 2500);
            });
    };

    if (!item) {
        return <p>Loading...</p>;
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-5 border rounded shadow-md">
            <h2 className="text-2xl font-bold mb-5">Editar Item</h2>

            {error && (
                <div className="alert alert-error mb-4">
                    <span>{error}</span>
                </div>
            )}

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
                <input
                    type="text"
                    placeholder="Nombre"
                    name="nombre"
                    value={item.nombre}
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
                    value={item.descripcion}
                    onChange={handleChange}
                    className="input input-bordered w-full max-w-xs"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Categoría</label>
                <SelectCategoria
                    name="categoria"
                    value={item.categoria}
                    onChange={handleChange}
                    permitirNuevo={true}
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Tipo</label>
                <p className="text-sm">
                    {item.tipo === "categoria" ? "Categoría (múltiples unidades)" : "Producto Unitario"}
                </p>
            </div>

            {item.tipo === "unitario" && (
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Stock</label>
                    <input
                        type="number"
                        min="0"
                        placeholder="Stock"
                        name="stock"
                        value={item.stock}
                        onChange={handleChange}
                        className="input input-bordered w-full max-w-xs"
                    />
                </div>
            )}

            {item.tipo === "categoria" && (
                <div className="mb-4">
                    {/* Existing extensions list */}
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Extensiones ({item.extensiones.length})
                    </label>

                    {item.extensiones.length > 0 ? (
                        <ul className="border rounded p-2 bg-base-200 mb-4 max-h-52 overflow-y-auto">
                            {item.extensiones.map((ext) => (
                                <li
                                    key={ext.codigo}
                                    className="flex justify-between items-center py-1"
                                >
                                    <div className="flex flex-col gap-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm">{ext.codigo}</span>
                                            {ext.disponible ? (
                                                <span className="badge badge-success badge-sm">Disponible</span>
                                            ) : (
                                                <span className="badge badge-error badge-sm">Prestado</span>
                                            )}
                                        </div>
                                        {ext.comentario && (
                                            <span className="text-xs text-gray-400">{ext.comentario}</span>
                                        )}
                                    </div>
                                    {ext.disponible && (
                                        <button
                                            type="button"
                                            onClick={() => eliminarExtension(ext.codigo)}
                                            className="btn btn-xs btn-error"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 mb-4">Sin extensiones registradas.</p>
                    )}

                    {/* Generator for adding more */}
                    <div className="border border-base-300 rounded-lg p-4 mt-2">
                        <h3 className="text-sm font-bold mb-3">Agregar más extensiones</h3>

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

                        <button
                            type="button"
                            onClick={handleGenerar}
                            className="btn btn-sm btn-primary"
                        >
                            Generar
                        </button>
                    </div>

                    {/* Preview of new extensions to add */}
                    {preview.length > 0 && (
                        <div className="mt-3 border rounded p-2 bg-base-100">
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                                Preview — {preview.length} nuevas extensiones
                            </p>
                            <ul className="max-h-36 overflow-y-auto mb-2">
                                {preview.map((ext) => (
                                    <li key={ext.codigo} className="flex items-center gap-2 py-0.5">
                                        <span className="font-mono text-sm flex-1">{ext.codigo}</span>
                                        <span className="badge badge-success badge-sm">Disponible</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={confirmarAgregarExtensiones}
                                    className="btn btn-sm btn-success"
                                >
                                    Agregar {preview.length} extensiones
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLimpiarPreview}
                                    className="btn btn-sm btn-ghost"
                                >
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-6">
                <button
                    onClick={handleSave}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    Guardar
                </button>
            </div>
            <QRgenerator id={item._id} />
            <EliminarItem id={item._id} />
        </div>
    );
}
