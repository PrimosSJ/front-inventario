import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { getLoansRequest as defaultGetLoansRequest } from "../api/loans.api";

/**
 * Hook to manage fetching, real-time updates, and filtering of loans.
 * @param {Object} apiDeps - Injectable API dependencies for testing/mocking.
 */
export function useLoansData({ getLoans = defaultGetLoansRequest } = {}) {
    const socket = useSocket();
    const [prestamos, setPrestamos] = useState([]);
    const [soloPendientes, setSoloPendientes] = useState(true);
    const [busqueda, setBusqueda] = useState("");

    useEffect(() => {
        getLoans()
            .then((res) => setPrestamos(res.data))
            .catch((err) => console.error("Failed to load loans:", err));

        if (!socket) return;

        const handleUpdate = (data) => {
            setPrestamos((prev) => {
                if (data && data._id && prev.some((p) => p._id === data._id)) {
                    return prev.map((p) => (p._id === data._id ? { ...p, ...data } : p));
                }
                return [data, ...prev];
            });
        };

        socket.on("prestamosUpdate", handleUpdate);

        return () => {
            socket.off("prestamosUpdate", handleUpdate);
        };
    }, [socket, getLoans]);

    const busquedaLower = busqueda.trim().toLowerCase();

    const prestamosFiltrados = prestamos
        .filter((p) => (soloPendientes ? !p.finalizado : true))
        .filter((p) => {
            if (!busquedaLower) return true;
            return (
                (p.nombre || "").toLowerCase().includes(busquedaLower) ||
                (p.rut || "").toLowerCase().includes(busquedaLower) ||
                (p.nombre_producto || "").toLowerCase().includes(busquedaLower) ||
                (p.email || "").toLowerCase().includes(busquedaLower)
            );
        });

    return {
        prestamos, setPrestamos,
        soloPendientes, setSoloPendientes,
        busqueda, setBusqueda,
        prestamosFiltrados
    };
}