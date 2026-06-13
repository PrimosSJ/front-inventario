import { useState, useMemo, useCallback } from "react";
import { useLoansData } from "../hooks/useLoans";
import { formatTimestamp, getPrestamoDate } from "../utils/date.utils";
import { formatRut } from "../utils/rut.utils";

import { returnLoanRequest } from "../api/loans.api";
import TiempoRestante from "../components/prestamos/TiempoRestante";
import { StarIcon, PublicIcon } from "../components/icons";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Renders the appropriate UI badge based on the loan type.
 * @param {string} type - The loan type identifier.
 * @returns {JSX.Element} The badge element.
 */
function renderLoanTypeBadge(type) {
    const types = {
        "especial": {
            icon: StarIcon,
            className: "text-warning",
            text: "Especial"
        },
        "publico": { // Note: Changed to match standard API output format
            icon: PublicIcon,
            className: "text-base-content/50",
            text: "Público"
        }
    }
    const { icon: Icon, className: _className, text } = types[type] ?? types["publico"];

    return (
        <div className="tooltip tooltip-bottom" data-tip={text}>
            <Icon className={`size-5 ${_className}`} />
        </div>
    );
}

/**
 * Evaluates loan data to render the correct return status component or text.
 * @param {Object} loan - The individual loan record.
 * @returns {JSX.Element} The formatted return status.
 */
function renderReturnStatus(loan) {
    const { tipo_prestamo, fecha_devolucion_esperada, finalizado, updatedAt } = loan;

    if (tipo_prestamo !== "especial" || !fecha_devolucion_esperada) {
        return <Empty />;
    }

    if (!finalizado) {
        return <TiempoRestante fechaIso={fecha_devolucion_esperada} />;
    }

    return (
        <span className="text-sm text-base-content/50">
            Devuelto {formatTimestamp(updatedAt)}
        </span>
    );
}

/**
 * Reusable Info Icon component to reduce JSX clutter.
 */
const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="size-5 cursor-help" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
    </svg>
);

const Empty = () => (
    <span className="text-base-content/30 text-lg font-sans">—</span>
);

/**
 * Master Page for Managing Loans.
 * Includes bulk actions, filtering, and a modernized data table.
 */
export default function LoansPage() {
    const {
        soloPendientes, setSoloPendientes,
        busqueda, setBusqueda,
        prestamosFiltrados, setPrestamos
    } = useLoansData();

    // UI Selection State
    const [selectedLoans, setSelectedLoans] = useState(new Set());
    const [isProcessing, setIsProcessing] = useState(false);

    /**
     * Memoizes the sorted array to prevent unnecessary re-calculations on every render.
     */
    const sortedLoans = useMemo(() => {
        return [...prestamosFiltrados].sort((a, b) => {
            const dateA = new Date(getPrestamoDate(a)).getTime();
            const dateB = new Date(getPrestamoDate(b)).getTime();
            return dateB - dateA; // Descending order (newest first)
        });
    }, [prestamosFiltrados]);

    const returnableLoans = useMemo(() => {
        return sortedLoans.filter(loan => !loan.finalizado);
    }, [sortedLoans]);

    const isAllSelected = returnableLoans.length > 0 && returnableLoans.every(loan => selectedLoans.has(loan._id));

    /**
     * Toggles a single loan selection.
     */
    const handleToggleSelection = useCallback((id) => {
        setSelectedLoans((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    /**
     * Toggles all visible, returnable loans.
     */
    const handleToggleAll = useCallback(() => {
        if (isAllSelected) {
            setSelectedLoans(new Set());
        } else {
            const newSelection = new Set(returnableLoans.map(l => l._id));
            setSelectedLoans(newSelection);
        }
    }, [isAllSelected, returnableLoans]);

    /**
     * Executes the bulk return action concurrently.
     * Uses Promise.all to map over selected IDs and handle responses efficiently.
     */
    const handleBulkReturn = async () => {
        if (selectedLoans.size === 0) return;
        if (selectedLoans.size > 2) {
            const isConfirmed = window.confirm(
                `¿Estás seguro de que deseas marcar los ${selectedLoans.size} préstamos seleccionados como devueltos?`
            );
            if (!isConfirmed) return;
        }

        setIsProcessing(true);

        try {
            // Initiate concurrent API requests for all selected loan IDs
            const requests = Array.from(selectedLoans).map((id) => returnLoanRequest(id));
            await Promise.all(requests);

            // Optimistic UI update: Mark all selected loans as returned in local state
            setPrestamos((prevLoans) =>
                prevLoans.map((loan) =>
                    selectedLoans.has(loan._id)
                        ? { ...loan, finalizado: true, updatedAt: new Date().toISOString() }
                        : loan
                )
            );

            // Clear selections upon success
            setSelectedLoans(new Set());
        } catch (error) {
            console.error("Failed to execute bulk return operation:", error);
            // In a production environment, implement a toast notification here to warn the user
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container mx-auto p-4 flex flex-col h-full gap-4 relative">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold">Préstamos</h1>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <input
                        type="search"
                        placeholder="Buscar por nombre, RUT, producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="input input-bordered w-full sm:w-80"
                    />
                    <label className="cursor-pointer label gap-2">
                        <span className="label-text font-medium text-base-content whitespace-nowrap">Solo pendientes</span>
                        <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={soloPendientes}
                            onChange={() => setSoloPendientes(!soloPendientes)}
                        />
                    </label>
                </div>
            </header>

            {/* Contextual Action Bar */}
            <AnimatePresence>
                {selectedLoans.size > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, y: 50 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: 50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed bottom-6 left-1/2 z-50 w-full max-w-xl px-4"
                    >
                        <div className="bg-base-300 container w-full -translate-x-1/2 p-4 rounded-box flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-sm font-mono">
                                    {selectedLoans.size}{" "}
                                    seleccionado{selectedLoans.size !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedLoans(new Set())}
                                    className="btn btn-sm btn-ghost hover:bg-base-200"
                                    disabled={isProcessing}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkReturn}
                                    disabled={isProcessing}
                                    className="btn btn-sm btn-primary px-4"
                                >
                                    {isProcessing && <span className="loading loading-spinner loading-xs"></span>}
                                    Devolver lote
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Data Table */}
            <div className="bg-base-100 border border-base-content/10 rounded-box overflow-hidden shadow-sm flex-1">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] w-full">
                    <table className="table table-zebra table-pin-rows w-full">
                        <thead>
                            <tr className="bg-base-200 text-base-content/80">
                                <th className="w-12 text-center">
                                    <label>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm checkbox-primary"
                                            checked={isAllSelected}
                                            onChange={handleToggleAll}
                                            disabled={returnableLoans.length === 0}
                                        />
                                    </label>
                                </th>
                                <th>Rut</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Producto</th>
                                <th>Extensión</th>
                                <th>Tipo</th>
                                <th>Fecha</th>
                                <th>Devolución</th>
                                <th>Estado</th>
                                <th className="w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode="popLayout">
                                {sortedLoans.map((prestamo) => {
                                    const isSelected = selectedLoans.has(prestamo._id);
                                    const isFinalizado = prestamo.finalizado;

                                    return (
                                        <motion.tr
                                            key={prestamo._id}
                                            layout

                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                            transition={{
                                                layout: { type: "spring", stiffness: 300, damping: 30 }
                                            }}
                                            className={`transition-colors duration-200 ${isSelected ? "bg-primary/5" : ""} ${!isFinalizado ? "hover:bg-base-200/50 cursor-pointer" : ""}`}
                                            onClick={() => !isFinalizado && handleToggleSelection(prestamo._id)}
                                        >
                                            <td className="text-center" onClick={(e) => e.stopPropagation()}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-sm checkbox-primary"
                                                        checked={isSelected}
                                                        onChange={() => handleToggleSelection(prestamo._id)}
                                                        disabled={isFinalizado}
                                                    />
                                                </label>
                                            </td>
                                            <td className="whitespace-nowrap font-mono text-sm text-base-content/80">
                                                {formatRut(prestamo.rut)}
                                            </td>
                                            <td className="line-clamp-2 max-w-[200px] font-medium">{prestamo.nombre}</td>
                                            <td className="text-sm max-w-[200px] truncate" title={prestamo.email}>
                                                {prestamo.email || <Empty />}
                                            </td>
                                            <td className="line-clamp-2 max-w-[200px]">{prestamo.nombre_producto}</td>
                                            <td className="font-mono text-sm">
                                                {prestamo.extension_codigo || <Empty />}
                                            </td>
                                            <td>{renderLoanTypeBadge(prestamo.tipo_prestamo)}</td>
                                            <td className="whitespace-nowrap text-sm">{formatTimestamp(getPrestamoDate(prestamo))}</td>
                                            <td className="whitespace-nowrap">{renderReturnStatus(prestamo)}</td>
                                            <td>
                                                {isFinalizado ? (
                                                    <span className="badge badge-success badge-outline badge-sm">Completado</span>
                                                ) : (
                                                    <span className="badge badge-warning badge-outline badge-sm">Pendiente</span>
                                                )}
                                            </td>
                                            <td className="text-center">
                                                {prestamo.comentario && (
                                                    <div className="tooltip tooltip-left" data-tip={prestamo.comentario}>
                                                        <InfoIcon />
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>

                            {sortedLoans.length === 0 && (
                                <tr>
                                    <td colSpan="11" className="text-center py-12 text-base-content/50">
                                        No se encontraron préstamos que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}