import { useEffect, useState } from "react";
import io from "socket.io-client";

import url, { api } from "../../utils";
import MarcarDevuelto from "./DevolverPrestamo";
import RutReader from "../RutReader";
import TiempoRestante from "./TiempoRestante";

function formatTimestamp(timestamp) {
    if (!timestamp) return "-";
    const d = new Date(timestamp);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
}

function getPrestamoDate(prestamo) {
    return prestamo.createdAt || prestamo.timestamp;
}

function renderTipoPrestamoBadge(tipo) {
    if (tipo === "especial") {
        return <span className="badge badge-warning">Especial</span>;
    }
    return <span className="badge badge-ghost">Público</span>;
}

const socket = io(url);

export default function PrestamosPorRut() {
    const [lista, setLista] = useState([]);
    const [rut, setRut] = useState("");

    const handleClick = (e) => {
        e.preventDefault();
        if (!rut) return;
        api
            .get(`/prestamos/history/${rut}`)
            .then((res) => {
                setLista(res.data);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    useEffect(() => {
        if (!rut) return;
        api
            .get(`/prestamos/history/${rut}`)
            .then((res) => {
                setLista(res.data);
            })
            .catch((err) => {
                console.log(err);
            });

        socket.on("prestamosUpdate", (data) => {
            if (!data) return;
            setLista((prev) => {
                if (data._id && prev.some((p) => p._id === data._id)) {
                    return prev.map((p) => (p._id === data._id ? { ...p, ...data } : p));
                }
                if (data.rut === rut) return [data, ...prev];
                return prev;
            });
        });

        return () => {
            socket.off("prestamosUpdate");
        };
    }, [rut]);

    return (
        <>
            <div className="container mx-auto p-4">
                <h1 className="text-3xl font-bold mb-6 text-center">Historial de Préstamos por Rut</h1>
                <div className="flex items-end justify-center mb-4 gap-4">
                    <RutReader onRutChange={setRut} />
                    <button
                        onClick={handleClick}
                        className="btn btn-primary"
                    >
                        Buscar
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th className="text-left">Rut</th>
                                <th className="text-left">Nombre</th>
                                <th className="text-left">Email</th>
                                <th className="text-left">Producto</th>
                                <th className="text-left">Extensión</th>
                                <th className="text-left">Tipo</th>
                                <th className="text-left">Fecha</th>
                                <th className="text-left">Devolución</th>
                                <th className="text-left">Estado</th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lista.map((prestamo) => (
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
                                            <MarcarDevuelto {...prestamo} />
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
        </>
    );
}
