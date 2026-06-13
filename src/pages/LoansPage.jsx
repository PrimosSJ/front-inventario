import { useLoansData } from "../hooks/useLoans";
import { formatTimestamp, getPrestamoDate } from "../utils/date.utils";

import MarcarDevuelto from "../components/prestamos/DevolverPrestamo";
import TiempoRestante from "../components/prestamos/TiempoRestante";

function renderTipoPrestamoBadge(tipo) {
    if (tipo === "especial") {
        return <span className="badge badge-warning">Especial</span>;
    }
    return <span className="badge badge-ghost">Público</span>;
}

export default function Prestamos() {
    const {
        soloPendientes, setSoloPendientes,
        busqueda, setBusqueda,
        prestamosFiltrados, setPrestamos
    } = useLoansData();

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Préstamos</h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nombre, RUT, producto o email..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="input input-bordered w-full sm:max-w-md"
                />
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700">Pendientes</span>
                    <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={soloPendientes}
                        onChange={() => setSoloPendientes(!soloPendientes)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                    <thead>
                        <tr>
                            <th>Rut</th>
                            <th>Nombre</th>
                            <th>Email</th>
                            <th>Producto</th>
                            <th>Extensión</th>
                            <th>Tipo</th>
                            <th>Fecha</th>
                            <th>Devolución</th>
                            <th>Estado</th>
                            <th className="w-8"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {prestamosFiltrados
                            .sort((a, b) => new Date(getPrestamoDate(b)) - new Date(getPrestamoDate(a)))
                            .map((prestamo) => (
                                <tr key={prestamo._id}>
                                    <td>{prestamo.rut}</td>
                                    <td>{prestamo.nombre}</td>
                                    <td className="text-sm">{prestamo.email || "-"}</td>
                                    <td>{prestamo.nombre_producto}</td>
                                    <td className="font-mono text-sm">
                                        {prestamo.extension_codigo || "-"}
                                    </td>
                                    <td>{renderTipoPrestamoBadge(prestamo.tipo_prestamo)}</td>
                                    <td>{formatTimestamp(getPrestamoDate(prestamo))}</td>
                                    <td>
                                        {prestamo.tipo_prestamo === "especial" &&
                                            prestamo.fecha_devolucion_esperada &&
                                            !prestamo.finalizado ? (
                                            <TiempoRestante fechaIso={prestamo.fecha_devolucion_esperada} />
                                        ) : prestamo.tipo_prestamo === "especial" &&
                                            prestamo.fecha_devolucion_esperada &&
                                            prestamo.finalizado ? (
                                            <span className="text-sm text-gray-400">
                                                Devuelto {formatTimestamp(prestamo.updatedAt)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td>
                                        {prestamo.finalizado ? (
                                            <span className="badge badge-ghost">Devuelto</span>
                                        ) : (
                                            <MarcarDevuelto
                                                {...prestamo}
                                                onUpdate={(updated) => {
                                                    setPrestamos((prev) =>
                                                        prev.map((p) =>
                                                            p._id === (updated._id || prestamo._id)
                                                                ? { ...p, ...updated, finalizado: true }
                                                                : p
                                                        )
                                                    );
                                                }}
                                            />
                                        )}
                                    </td>
                                    <td className="text-center">
                                        {prestamo.comentario ? (
                                            <div className="tooltip tooltip-left" data-tip={prestamo.comentario}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-info cursor-pointer" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}