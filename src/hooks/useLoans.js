import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useSocket } from "../context/SocketContext";
import { getLoansRequest as defaultGetLoansRequest, returnLoanRequest } from "../api/loans.api";
import { getPrestamoDate } from "../utils/date.utils";
import { normalizeText, lazyMatch } from "../utils/search.utils";

export const LOANS_QUERY_KEY = ["loans"];

/**
 * Deep structural immutability definition for baseline comparisons.
 */
const INITIAL_STATE = Object.freeze({
    busqueda: "",
    filters: Object.freeze({
        status: "pending",
        type: "all",
    })
});

/**
 * Architectural utility to detect variations against baseline schemas.
 */
const hasStateChanged = (current, baseline) => {
    if (current === baseline) return false;
    if (typeof current !== "object" || current === null) return true;

    return Object.keys(baseline).some(key => {
        if (typeof baseline[key] === "object" && baseline[key] !== null) {
            return hasStateChanged(current[key], baseline[key]);
        }
        return current[key] !== baseline[key];
    });
};

/**
 * Hook to manage fetching, real-time updates, and filtering of loans.
 * @param {Object} apiDeps - Injectable API dependencies for testing/mocking.
 */
export function useLoansData({ getLoans = defaultGetLoansRequest } = {}) {
    const socket = useSocket();
    const queryClient = useQueryClient();

    const [busqueda, setBusqueda] = useState(INITIAL_STATE.busqueda);
    const [filters, setFilters] = useState({ ...INITIAL_STATE.filters });
    const [sortConfig, setSortConfig] = useState({ key: "fecha", direction: "desc" });

    const {
        data: prestamos = [],
        isLoading,
        isError
    } = useQuery({
        queryKey: LOANS_QUERY_KEY,
        queryFn: async () => {
            const response = await getLoans();
            return response.data;
        }
    });

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (updatedLoan) => {
            queryClient.setQueryData(LOANS_QUERY_KEY, (oldData) => {
                if (!oldData) return [updatedLoan];

                const exists = oldData.some((p) => p._id === updatedLoan._id);
                if (exists) {
                    return oldData.map((p) => (p._id === updatedLoan._id ? { ...p, ...updatedLoan } : p));
                }
                return [updatedLoan, ...oldData];
            });
        };

        socket.on("prestamosUpdate", handleUpdate);

        return () => {
            socket.off("prestamosUpdate", handleUpdate);
        };
    }, [socket, queryClient]);

    /**
     * Updates a specific filter key dynamically.
     * @param {string} key - The filter identifier (e.g., 'status', 'type').
     * @param {string} value - The new filter value.
     */
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const prestamosProcesados = useMemo(() => {
        const normalizedQuery = normalizeText(busqueda);

        // Filtrado
        let result = prestamos.filter((p) => {
            if (normalizedQuery) {
                const matchesSearch =
                    lazyMatch(p.nombre, normalizedQuery) ||
                    lazyMatch(p.rut, normalizedQuery) ||
                    lazyMatch(p.nombre_producto, normalizedQuery) ||
                    lazyMatch(p.email, normalizedQuery);

                if (!matchesSearch) return false;
            }

            if (filters.status === "pending" && p.finalizado) return false;
            if (filters.status === "returned" && !p.finalizado) return false;
            if (filters.type !== "all" && p.tipo_prestamo !== filters.type) return false;

            return true;
        });

        // Ordenamiento
        return result.sort((a, b) => {
            let valA, valB;
            switch (sortConfig.key) {
                case "rut":
                    valA = a.rut ?? "";
                    valB = b.rut ?? "";
                    break;
                case "nombre":
                    valA = normalizeText(a.nombre);
                    valB = normalizeText(b.nombre);
                    break;
                case "email":
                    valA = normalizeText(a.email);
                    valB = normalizeText(b.email);
                    break;
                case "producto":
                    valA = normalizeText(a.nombre_producto);
                    valB = normalizeText(b.nombre_producto);
                    break;
                case "fecha":
                default:
                    valA = new Date(getPrestamoDate(a)).getTime();
                    valB = new Date(getPrestamoDate(b)).getTime();
                    break;
            }

            if (valA === valB) return 0;
            return sortConfig.direction === "asc"
                ? (valA > valB ? 1 : -1)
                : (valA < valB ? 1 : -1);
        });
    }, [prestamos, busqueda, filters, sortConfig]);

    const hasActiveFilters = useMemo(() => {
        return hasStateChanged({ busqueda, filters }, INITIAL_STATE);
    }, [busqueda, filters]);

    return {
        prestamos,
        isLoading,
        isError,
        busqueda,
        setBusqueda,
        filters,
        hasActiveFilters,
        handleFilterChange,
        prestamosFiltrados: prestamosProcesados,
        sortConfig,
        setSortConfig
    };
}

/**
 * Mutation to handle a single loan return with Optimistic Updates.
 */
export function useReturnLoanMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => returnLoanRequest(id),
        // Fired immediately when mutate() is called, before the API responds
        onMutate: async (id) => {
            // Cancel background refetches to prevent race conditions
            await queryClient.cancelQueries({ queryKey: LOANS_QUERY_KEY });

            // Snapshot the previous data for a potential rollback
            const previousLoans = queryClient.getQueryData(LOANS_QUERY_KEY);

            // Optimistically update the cache
            queryClient.setQueryData(LOANS_QUERY_KEY, (oldLoans) => {
                if (!oldLoans) return oldLoans;
                return oldLoans.map((loan) =>
                    loan._id === id
                        ? { ...loan, finalizado: true, updatedAt: new Date().toISOString() }
                        : loan
                );
            });

            // Return the context containing the snapshot
            return { previousLoans };
        },
        // Fired only if the API request fails
        onError: (error, id, context) => {
            // Rollback to the snapshot
            if (context?.previousLoans) {
                queryClient.setQueryData(LOANS_QUERY_KEY, context.previousLoans);
            }
            console.error("Mutation failed, cache rolled back:", error);
        }
    });
}

/**
 * Mutation to handle bulk loan returns with Optimistic Updates.
 */
export function useBulkReturnLoansMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        // Execute all API requests concurrently
        mutationFn: async (ids) => {
            const requests = Array.from(ids).map((id) => returnLoanRequest(id));
            return Promise.all(requests);
        },
        onMutate: async (ids) => {
            await queryClient.cancelQueries({ queryKey: LOANS_QUERY_KEY });
            const previousLoans = queryClient.getQueryData(LOANS_QUERY_KEY);
            const idsSet = new Set(ids);

            queryClient.setQueryData(LOANS_QUERY_KEY, (oldLoans) => {
                if (!oldLoans) return oldLoans;
                return oldLoans.map((loan) =>
                    idsSet.has(loan._id)
                        ? { ...loan, finalizado: true, updatedAt: new Date().toISOString() }
                        : loan
                );
            });

            return { previousLoans };
        },
        onError: (error, ids, context) => {
            if (context?.previousLoans) {
                queryClient.setQueryData(LOANS_QUERY_KEY, context.previousLoans);
            }
        }
    });
}