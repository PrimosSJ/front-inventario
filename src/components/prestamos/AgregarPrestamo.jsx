import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { api } from "../../utils";
import RutReader from "../RutReader";
import { enviarConfirmacionPrestamo } from "../../services/emailService";

export default function AgregarPrestamo() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [producto, setProducto] = useState(null);
    const [extensionesDisponibles, setExtensionesDisponibles] = useState([]);
    const [error, setError] = useState(null);
    const [emailWarning, setEmailWarning] = useState(false);

    const [allProducts, setAllProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);

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
        if (id) {
            cargarProducto(id);
        } else {
            api.get("/inventario")
                .then((res) => setAllProducts(res.data || []))
                .catch(() => {});
        }
    }, [id]);

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

        const tipoPrestamo = producto.tipo_prestamo || "publico";

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
            .then((res) => {
                const prestamo = res.data;
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
                void prestamo;
                navigate("/");
            })
            .catch((err) => {
                setError(err.response?.data?.message || "Error al registrar el préstamo");
            });
    }

    const tipoPrestamo = producto?.tipo_prestamo || "publico";
    const esEspecial = tipoPrestamo === "especial";
    const esCategoria = producto?.tipo === "categoria";

    return (
        <div className="max-w-md mx-auto mt-10 p-5 border rounded shadow-md">
            <h2 className="text-2xl font-bold mb-5">Agregar Préstamo</h2>

            {error && (
                <div className="alert alert-error mb-4">
                    <span>{error}</span>
                </div>
            )}

            {emailWarning && (
                <div className="alert alert-warning mb-4">
                    <span>Préstamo creado, pero no se pudo enviar el email de confirmación.</span>
                    <button className="btn btn-xs btn-ghost ml-auto" onClick={() => setEmailWarning(false)}>✕</button>
                </div>
            )}

            {!id && (
                <div className="mb-4 relative">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Buscar producto</label>
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
                        <ul className="absolute z-10 w-full bg-base-100 border border-base-300 rounded-b shadow-lg max-h-48 overflow-y-auto">
                            {filteredProducts.map((p) => (
                                <li
                                    key={p._id}
                                    className="px-4 py-2 cursor-pointer hover:bg-base-200 flex justify-between items-center"
                                    onMouseDown={() => handleSelectProduct(p)}
                                >
                                    <span className="font-semibold">{p.nombre}</span>
                                    <span className="text-xs text-gray-400">
                                        {p.categoria} · {p.tipo_prestamo === "especial" ? "Especial" : "Público"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {dropdownOpen && searchQuery.length >= 2 && filteredProducts.length === 0 && (
                        <div className="absolute z-10 w-full bg-base-100 border border-base-300 rounded-b shadow-lg px-4 py-2 text-sm text-gray-400">
                            Sin resultados
                        </div>
                    )}
                </div>
            )}

            {producto && (
                <div className="mb-4 p-3 bg-base-200 rounded">
                    <p className="text-sm text-gray-600">Producto a prestar:</p>
                    <p className="font-bold">{producto.nombre}</p>
                    <div className="flex gap-2 mt-1">
                        <span className="badge badge-sm">
                            {producto.tipo === "categoria" ? "Categoría" : "Unitario"}
                        </span>
                        <span className={`badge badge-sm ${esEspecial ? "badge-warning" : "badge-ghost"}`}>
                            {esEspecial ? "Especial" : "Público"}
                        </span>
                    </div>
                </div>
            )}

            <div className="mb-4">
                <RutReader onRutChange={handleRutChange} />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
                <input
                    type="text"
                    placeholder="Nombre"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="input input-bordered w-full max-w-xs"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input input-bordered w-full max-w-xs"
                />
            </div>

            {esEspecial && (
                <>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Teléfono</label>
                        <input
                            type="tel"
                            placeholder="+56 9 ..."
                            name="telefono"
                            value={form.telefono}
                            onChange={handleChange}
                            className="input input-bordered w-full max-w-xs"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Fecha de devolución esperada
                        </label>
                        <input
                            type="date"
                            name="fecha_devolucion_esperada"
                            value={form.fecha_devolucion_esperada}
                            onChange={handleChange}
                            className="input input-bordered w-full max-w-xs date-input-dark"
                        />
                    </div>
                </>
            )}

            {esCategoria && (
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Extensión a prestar</label>
                    <select
                        name="extension_codigo"
                        value={form.extension_codigo}
                        onChange={handleChange}
                        className="select select-bordered w-full max-w-xs"
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

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Comentario</label>
                <textarea
                    placeholder="Comentario"
                    name="comentario"
                    value={form.comentario}
                    onChange={handleChange}
                    className="textarea textarea-bordered w-full max-w-xs"
                ></textarea>
            </div>

            <button
                onClick={handleAddPrestamo}
                disabled={!producto}
                className="btn btn-primary btn-xs sm:btn-md lg:btn-lg"
            >
                Agregar
            </button>
        </div>
    );
}
