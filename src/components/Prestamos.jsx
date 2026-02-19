import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";

import url from "../utils";
import MarcarDevuelto from "./prestamos/DevolverPrestamo";

const socket = io(url);

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

export default function Prestamos() {
    const [prestamos, setPrestamos] = useState([]);

    useEffect(() => {
        axios
        .get(url + "/prestamos")
        .then((res) => {
            setPrestamos(res.data);
        })
        .catch((err) => {
            console.log(err);
        });

        socket.on("prestamosUpdate", (data) => {
            setPrestamos(prevPrestamos => {
                return [data, ...prevPrestamos];
            });
            console.log(data);
        });

        return () => {
            socket.off("prestamosUpdate");
        };
    }, []);

    return (
        <>
            {prestamos && (
                <div className="container mx-auto p-4">
                    <h1 className="text-3xl font-bold mb-6 text-center">Préstamos</h1>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th className="text-left">Rut</th>
                                    <th className="text-left">Producto</th>
                                    <th className="text-left">Timestamp</th>
                                    <th className="text-left">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prestamos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                    .map((prestamo) => (
                                    <tr key={prestamo._id}>
                                        <td>{prestamo.rut}</td>
                                        <td>{prestamo.nombre_producto}</td>
                                        <td>{formatTimestamp(prestamo.timestamp)}</td>
                                        <td>
                                            {prestamo.finalizado ? (
                                                <span className="badge badge-success">Devuelto</span>
                                            ) : (
                                                <MarcarDevuelto {...prestamo} />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>

    )
}