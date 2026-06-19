import { useState, useEffect, useMemo } from "react";
import { useSocket } from "../context/SocketContext";
import { getLoansRequest as defaultGetLoansRequest } from "../api/loans.api";
import { getPrestamoDate } from "../utils/date.utils";

/**
 * Hook to manage fetching, real-time updates, and filtering of loans.
 * @param {Object} apiDeps - Injectable API dependencies for testing/mocking.
 */
export function useLoansData({ getLoans = defaultGetLoansRequest } = {}) {
    const socket = useSocket();
    const [prestamos, setPrestamos] = useState([]);

    const [busqueda, setBusqueda] = useState("");
    const [filters, setFilters] = useState({
        status: "pending",
        type: "all",
    });
    const [sortConfig, setSortConfig] = useState({ key: "fecha", direction: "desc" });

    /**
     * Updates a specific filter key dynamically.
     * @param {string} key - The filter identifier (e.g., 'status', 'type').
     * @param {string} value - The new filter value.
     */
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

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

    const prestamosProcesados = useMemo(() => {
        const busquedaLower = busqueda.trim().toLowerCase();

        // Filtrado
        let result = prestamos.filter((p) => {
            if (busquedaLower && !(
                (p.nombre || "").toLowerCase().includes(busquedaLower) ||
                (p.rut || "").toLowerCase().includes(busquedaLower) ||
                (p.nombre_producto || "").toLowerCase().includes(busquedaLower) ||
                (p.email || "").toLowerCase().includes(busquedaLower)
            )) return false;

            if (filters.status === "pending" && p.finalizado) return false;
            if (filters.status === "returned" && !p.finalizado) return false;
            if (filters.type !== "all" && p.tipo_prestamo !== filters.type) return false;

            return true;
        });

        // Ordenamiento
        return result.sort((a, b) => {
            let valA, valB;
            switch (sortConfig.key) {
                case "rut": valA = a.rut ?? ""; valB = b.rut ?? ""; break;
                case "nombre": valA = (a.nombre ?? "").toLowerCase(); valB = (b.nombre ?? "").toLowerCase(); break;
                case "email": valA = (a.email ?? "").toLowerCase(); valB = (b.email ?? "").toLowerCase(); break;
                case "producto": valA = (a.nombre_producto ?? "").toLowerCase(); valB = (b.nombre_producto ?? "").toLowerCase(); break;
                case "fecha": default: valA = new Date(getPrestamoDate(a)).getTime(); valB = new Date(getPrestamoDate(b)).getTime(); break;
            }
            if (valA === valB) return 0;
            return sortConfig.direction === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
        });
    }, [prestamos, busqueda, filters, sortConfig]);

    return {
        prestamos,
        setPrestamos,
        busqueda,
        setBusqueda,
        filters,
        handleFilterChange,
        prestamosFiltrados: prestamosProcesados,
        sortConfig,
        setSortConfig
    };
}