import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import { api } from "../../utils";
import RutReader from "../RutReader";
import { enviarConfirmacionPrestamo } from "../../services/email.service";

export default function AgregarPrestamo({ onClose, initialProductId = null }) {
    const [producto, setProducto] = useState(null);
    const [extensionesDisponibles, setExtensionesDisponibles] = useState([]);
    const [error, setError] = useState(null);
    const [emailWarning, setEmailWarning] = useState(false);
    const [successMsg, setSuccessMsg] = useState(null);

    const [allProducts, setAllProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // tipo_prestamo is chosen at loan time, not from the product
    const [esEspecial, setEsEspecial] = useState(false);

    const [form, setForm] = useState({
        rut: "",
        nombre: "",
        email: "",
        telefono: "",
        comentario: "",
        extension_codigo: "",
        fecha_devolucion_esperada: "",
    });

    const cargarProducto = (productoId) => {
        if (!productoId) return;
        api
            .get(`/inventario/${productoId}`)
            .then((res) => {
                if (!res.data || !res.data._id) {
                    setError("Producto no encontrado");
                    setProducto(null);
                    return;
                }
                setProducto(res.data);
                setError(null);

                if (res.data.tipo === "categoria") {
                    api
                        .get(`/inventario/${productoId}/extensiones-disponibles`)
                        .then((r) => setExtensionesDisponibles(r.data || []))
                        .catch(() => setExtensionesDisponibles([]));
                } else {
                    setExtensionesDisponibles([]);
                }
            })
            .catch(() => {
                setError("No se pudo cargar el producto");
                setProducto(null);
            });
    };

    useEffect(() => {
        if (initialProductId) {
            cargarProducto(initialProductId);
        } else {
            api.get("/inventario")
                .then((res) => setAllProducts(res.data || []))
                .catch(() => { });
        }
    }, [initialProductId]);

    const filteredProducts = searchQuery.length >= 2
        ? allProducts.filter((p) =>
            p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.categoria || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const handleSelectProduct = (p) => {
        setSearchQuery(p.nombre);
        setDropdownOpen(false);
        cargarProducto(p._id);
    };

    function handleChange(e) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    }

    function handleRutChange(rut) {
        setForm((prev) => ({ ...prev, rut }));
    }

    function handleAddPrestamo() {
        if (!producto) {
            setError("Debes seleccionar un producto válido");
            return;
        }

        const tipoPrestamo = esEspecial ? "especial" : "publico";

        if (!form.rut || !form.nombre || !form.email) {
            setError("RUT, nombre y email son obligatorios");
            return;
        }

        if (tipoPrestamo === "especial") {
            if (!form.telefono || !form.fecha_devolucion_esperada) {
                setError("Para préstamos especiales: teléfono y fecha de devolución son obligatorios");
                return;
            }
        }

        if (producto.tipo === "categoria" && !form.extension_codigo) {
            setError("Debes seleccionar una extensión disponible");
            return;
        }

        const payload = {
            rut: form.rut,
            nombre: form.nombre,
            email: form.email,
            id_producto: producto._id,
            tipo_prestamo: tipoPrestamo,
            comentario: form.comentario,
        };

        if (tipoPrestamo === "especial") {
            payload.telefono = form.telefono;
            payload.fecha_devolucion_esperada = form.fecha_devolucion_esperada;
        }

        if (producto.tipo === "categoria") {
            payload.extension_codigo = form.extension_codigo;
        }

        api
            .post("/prestamos", payload)
            .then(() => {
                setSuccessMsg("Préstamo registrado exitosamente.");
                enviarConfirmacionPrestamo({
                    email: form.email,
                    nombre: form.nombre,
                    nombre_producto: producto.nombre,
                    extension_codigo: form.extension_codigo || null,
                    tipo_prestamo: tipoPrestamo,
                    fecha_devolucion_esperada: form.fecha_devolucion_esperada || null,
                }).catch((err) => {
                    console.error("No se pudo enviar el email de confirmación:", err);
                    setEmailWarning(true);
                });

                // Close modal after a brief success message
                setTimeout(() => {
                    if (onClose) onClose();
                }, 1200);
            })
            .catch((err) => {
                setError(err.response?.data?.message || "Error al registrar el préstamo");
            });
    }

    const esCategoria = producto?.tipo === "categoria";

    return (
        <div className="w-full flex flex-col gap-4">
            <div>
                <h2 className="text-2xl font-bold">Agregar Préstamo</h2>
                <p className="text-sm text-base-content/70">Registra un nuevo préstamo en el sistema.</p>
            </div>

            {error && (
                <div className="alert alert-error py-2">
                    <span>{error}</span>
                </div>
            )}

            {successMsg && (
                <div className="alert alert-success py-2">
                    <span>{successMsg}</span>
                </div>
            )}

            {emailWarning && (
                <div className="alert alert-warning py-2">
                    <span>Préstamo creado, pero no se pudo enviar el email de confirmación.</span>
                    <button className="btn btn-xs btn-ghost ml-auto" onClick={() => setEmailWarning(false)}>✕</button>
                </div>
            )}

            {!initialProductId && (
                <div className="relative z-50">
                    <label className="block text-sm font-bold mb-1">Buscar producto</label>
                    <input
                        type="text"
                        placeholder="Escribe el nombre del producto..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setDropdownOpen(e.target.value.length >= 2);
                            if (e.target.value.length < 2) setProducto(null);
                        }}
                        onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                        onFocus={() => searchQuery.length >= 2 && setDropdownOpen(true)}
                        className="input input-bordered w-full"
                        autoComplete="off"
                    />
                    {dropdownOpen && filteredProducts.length > 0 && (
                        <ul className="absolute w-full bg-base-100 border border-base-300 rounded-b shadow-lg max-h-48 overflow-y-auto">
                            {filteredProducts.map((p) => (
                                <li
                                    key={p._id}
                                    className="px-4 py-2 cursor-pointer hover:bg-base-200 flex justify-between items-center"
                                    onMouseDown={() => handleSelectProduct(p)}
                                >
                                    <span className="font-semibold">{p.nombre}</span>
                                    <span className="text-xs text-base-content/50">{p.categoria}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {dropdownOpen && searchQuery.length >= 2 && filteredProducts.length === 0 && (
                        <div className="absolute w-full bg-base-100 border border-base-300 rounded-b shadow-lg px-4 py-2 text-sm text-base-content/50">
                            Sin resultados
                        </div>
                    )}
                </div>
            )}

            {producto && (
                <div className="p-3 bg-base-200 rounded border border-base-300">
                    <p className="text-xs text-base-content/70">Producto a prestar:</p>
                    <p className="font-bold">{producto.nombre}</p>
                    <span className="badge badge-sm mt-1">
                        {producto.tipo === "categoria" ? "Categoría" : "Unitario"}
                    </span>
                </div>
            )}

            <div className="flex items-center gap-3">
                <label className="text-sm font-bold">Préstamo Especial</label>
                <input
                    type="checkbox"
                    className="toggle toggle-warning"
                    checked={esEspecial}
                    onChange={(e) => {
                        setEsEspecial(e.target.checked);
                        if (!e.target.checked) {
                            setForm((prev) => ({ ...prev, telefono: "", fecha_devolucion_esperada: "" }));
                        }
                    }}
                />
                {esEspecial && <span className="badge badge-warning badge-sm">Especial</span>}
            </div>

            <div className="grid gap-3">
                <RutReader onRutChange={handleRutChange} />

                <div>
                    <label className="block text-sm font-bold mb-1">Nombre</label>
                    <input
                        type="text"
                        placeholder="Nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold mb-1">Email</label>
                    <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="input input-bordered w-full"
                    />
                </div>

                {esEspecial && (
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-sm font-bold mb-1">Teléfono</label>
                            <input
                                type="tel"
                                placeholder="+56 9 ..."
                                name="telefono"
                                value={form.telefono}
                                onChange={handleChange}
                                className="input input-bordered w-full"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-bold mb-1">Devolución esperada</label>
                            <input
                                type="date"
                                name="fecha_devolucion_esperada"
                                value={form.fecha_devolucion_esperada}
                                onChange={handleChange}
                                className="input input-bordered w-full date-input-dark"
                            />
                        </div>
                    </div>
                )}

                {esCategoria && (
                    <div>
                        <label className="block text-sm font-bold mb-1">Extensión a prestar</label>
                        <select
                            name="extension_codigo"
                            value={form.extension_codigo}
                            onChange={handleChange}
                            className="select select-bordered w-full"
                        >
                            <option value="">Selecciona una extensión disponible</option>
                            {extensionesDisponibles.map((ext) => (
                                <option key={ext.codigo} value={ext.codigo}>
                                    {ext.codigo}
                                </option>
                            ))}
                        </select>
                        {extensionesDisponibles.length === 0 && (
                            <p className="text-xs text-error mt-1">
                                No hay extensiones disponibles para este producto.
                            </p>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold mb-1">Comentario</label>
                    <textarea
                        placeholder="Comentario opcional..."
                        name="comentario"
                        value={form.comentario}
                        onChange={handleChange}
                        className="textarea textarea-bordered w-full"
                        rows={2}
                    ></textarea>
                </div>
            </div>

            <div className="modal-action mt-2">
                <button type="button" onClick={onClose} className="btn btn-ghost">
                    Cancelar
                </button>
                <button
                    onClick={handleAddPrestamo}
                    disabled={!producto}
                    className="btn btn-primary"
                >
                    Agregar Préstamo
                </button>
            </div>
        </div>
    );
}

AgregarPrestamo.propTypes = {
    onClose: PropTypes.func.isRequired,
    initialProductId: PropTypes.string,
};