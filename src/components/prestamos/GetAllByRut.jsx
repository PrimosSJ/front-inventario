import { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

import url from "../../utils";
import MarcarDevuelto from "./DevolverPrestamo";
import RutReader from "../RutReader";

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

const socket = io(url);

export default function PrestamosPorRut() {
    const [lista, setLista] = useState([]);
    const [rut, setRut] = useState("");

    const handleClick = (e) => {
        e.preventDefault();
        axios
           .get(url + `/prestamos/history/${rut}`)
           .then((res) => {
                setLista(res.data);
            })
           .catch((err) => {
                console.log(err);
            });
    };

    useEffect(() => {
        axios
        .get(url + `/prestamos/history/${rut}`)
        .then((res) => {
            setLista(res.data);
        })
        .catch((err) => {
            console.log(err);
        });

        socket.on("prestamosUpdate", (data) => {
            setLista(data);
            console.log(data);
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
                        className="btn btn-primary">
                        Buscar
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th className="text-left">Rut</th>
                                <th className="text-left">Nombre</th>
                                <th className="text-left">Producto</th>
                                <th className="text-left">Fecha</th>
                                <th className="text-left">Monto</th>
                                <th className="text-left">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lista.map((prestamo) => (
                                <tr key={prestamo._id}>
                                    <td>{prestamo.rut}</td>
                                    <td>{prestamo.nombre}</td>
                                    <td>{prestamo.nombre_producto}</td>
                                    <td>{formatTimestamp(prestamo.timestamp)}</td>
                                    <td>{prestamo.monto}</td>
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
        </>

    )
}