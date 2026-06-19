import { useEffect, useState } from "react";

import MarcarDevuelto from "../components/prestamos/DevolverPrestamo";
import RutReader from "../components/shared/RutReader";
import ReturnStatus from "../components/prestamos/ReturnStatus";

import { getLoansByRutRequest } from "../api/loans.api";
import { useSocket } from "../context/SocketContext";

import DataPageLayout from "../components/layout/DataPageLayout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";

function renderTipoPrestamoBadge(tipo) {
    if (tipo === "especial") {
        return <span className="badge badge-warning shadow-sm/50">Especial</span>;
    }
    return <span className="badge badge-ghost shadow-sm/50 text-base-content/70">Público</span>;
}

export default function PrestamosPorRut() {
    const socket = useSocket();
    const [lista, setLista] = useState([]);
    const [rut, setRut] = useState("");

    const handleClick = (e) => {
        e.preventDefault();
        if (!rut) return;
        getLoansByRutRequest(rut)
            .then((res) => setLista(res.data))
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        if (!rut || !socket) return;
        getLoansByRutRequest(rut)
            .then((res) => setLista(res.data))
            .catch((err) => console.log(err));

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

        return () => socket.off("prestamosUpdate");
    }, [rut, socket]);

    return (
        <DataPageLayout
            title="Historial de Préstamos"
            headerActions={
                <div className="flex items-end gap-3">
                    <RutReader onRutChange={setRut} className="w-full sm:w-64" />
                    <button onClick={handleClick} className="btn btn-primary h-9 min-h-9">
                        Buscar
                    </button>
                </div>
            }
        >
            <Table wrapperClassName="flex-1 grow min-h-0" zebra>
                <TableHeader className="bg-base-200 select-none">
                    <TableRow>
                        <TableHead pin>Rut</TableHead>
                        <TableHead pin>Nombre</TableHead>
                        <TableHead pin>Email</TableHead>
                        <TableHead pin>Producto</TableHead>
                        <TableHead pin>Extensión</TableHead>
                        <TableHead pin>Tipo</TableHead>
                        <TableHead pin>Fecha</TableHead>
                        <TableHead pin>Estado</TableHead>
                        <TableHead pin className="w-8"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lista.map((prestamo) => (
                        <TableRow key={prestamo._id} interactive={!prestamo.finalizado}>
                            <TableCell className="whitespace-nowrap font-mono tracking-tight text-base-content/60">
                                {prestamo.rut}
                            </TableCell>
                            <TableCell className="font-medium min-w-40">{prestamo.nombre}</TableCell>
                            <TableCell className="text-sm max-w-60 truncate">{prestamo.email || "-"}</TableCell>
                            <TableCell className="min-w-40 line-clamp-2">{prestamo.nombre_producto}</TableCell>
                            <TableCell className="font-mono text-sm tracking-wider">
                                {prestamo.extension_codigo || "-"}
                            </TableCell>
                            <TableCell>{renderTipoPrestamoBadge(prestamo.tipo_prestamo)}</TableCell>
                            <TableCell className="whitespace-nowrap">
                                <ReturnStatus prestamo={prestamo} />
                            </TableCell>
                            <TableCell>
                                {prestamo.finalizado ? (
                                    <span className="badge badge-ghost text-base-content/60 shadow-sm/50">Devuelto</span>
                                ) : (
                                    <MarcarDevuelto {...prestamo} />
                                )}
                            </TableCell>
                            <TableCell className="text-center">
                                {prestamo.comentario && (
                                    <div className="tooltip tooltip-left cursor-help" data-tip={prestamo.comentario}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                    {lista.length === 0 && (
                        <TableRow>
                            <TableCell colSpan="9" className="text-center py-12 text-base-content/50">
                                No se encontraron resultados. Busque un RUT para visualizar su historial.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </DataPageLayout>
    );
}