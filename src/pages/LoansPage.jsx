import { useState, useMemo, useCallback, useRef, useEffect } from "react";

import { formatTimestamp, getPrestamoDate } from "../utils/date.utils";
import { formatRut } from "../utils/rut.utils";

import { useLoansData, useBulkReturnLoansMutation } from "../hooks/useLoans";

import { StarIcon, PublicIcon, CommentQuoteIcon, ArrowDownIcon, FilterIcon } from "../components/icons";
import ReturnStatus from "../components/prestamos/ReturnStatus";
import SearchBar from "../components/ui/SearchBar";
import DataPageLayout from "../components/layout/DataPageLayout";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../components/ui/Table";
import { EmptyRow } from "../components/ui/Table/utils";

import { motion, AnimatePresence } from "framer-motion";
import Tooltip from "../components/ui/Tooltip";
import Button from "../components/ui/Button";
import { Menu, MenuTrigger, MenuContent, MenuLabel } from "../components/ui/Menu";
import QueryStateManager from "../components/ui/QueryStateManager";
import { SkeletonTable } from "../components/ui/Skeleton";

/**
 * Dropdown component for Filtering
 */
const FilterDropdown = ({ filters, onFilterChange, hasActiveFilters }) => {
    // Synced with the hook "useLoans.js"
    const filterDefinitions = [
        {
            id: "status",
            label: "Estado",
            options: [
                { value: "all", label: "Todos" },
                { value: "pending", label: "Solo pendientes" },
                { value: "returned", label: "Finalizados" }
            ]
        },
        {
            id: "type",
            label: "Tipo de Préstamo",
            options: [
                { value: "all", label: "Todos" },
                { value: "especial", label: "Especial" },
                { value: "publico", label: "Público" }
            ]
        }
    ];

    return (
        <Menu placement="bottom-end">
            <MenuTrigger>
                <Button color="neutral" leftIcon={<FilterIcon />}>
                    Filtrar
                    <AnimatePresence>
                        {hasActiveFilters && (
                            <Tooltip content="Filtros aplicados">
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute size-3 bg-primary rounded-full top-1 right-1 translate-x-1/2 -translate-y-1/3"
                                />
                            </Tooltip>
                        )}
                    </AnimatePresence>
                </Button>
            </MenuTrigger>

            <MenuContent>
                {filterDefinitions.map((group) => (
                    <>
                        <MenuLabel>
                            {group.label}
                        </MenuLabel>
                        <div key={group.id} className="flex flex-col gap-2 px-2">
                            <select
                                className="select select-bordered w-full"
                                value={filters[group.id]}
                                onChange={(e) => onFilterChange(group.id, e.target.value)}
                            >
                                {group.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                ))}
            </MenuContent>
        </Menu>
    );
};

/**
 * Renders the appropriate UI badge based on the loan type.
 * @param {string} type - The loan type identifier.
 * @returns {JSX.Element} The badge element.
 */
function renderLoanTypeBadge(type) {
    const types = {
        "especial": {
            icon: StarIcon,
            className: "text-base-content",
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
        <Tooltip content={text}>
            <div className="justify-center cursor-help items-center flex">
                <Icon className={`size-5 ${_className}`} />
            </div>
        </Tooltip>
    );
}

/**
 * Splits a product string formatted as "Category - Product Name" 
 * into its constituent parts.
 *
 * @param {string} rawProductName - The original product string.
 * @returns {{ category: string, name: string }} The separated category and product name.
 */
function parseProductString(rawProductName) {
    const parts = rawProductName.split(/\s+-\s+/);

    if (parts.length <= 1) {
        return { category: "", name: parts[0] };
    }

    return {
        category: parts[0],
        name: parts.slice(1).join(' - ')
    };
}

/**
 * Configuration for table columns definition.
 * @type {Array<{ key: string | null, label: string, sortable: boolean, alignment?: string, className?: string }>}
 */
const TABLE_COLUMNS = [
    { key: "rut", label: "Rut", sortable: true },
    { key: "nombre", label: "Nombre", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "producto", label: "Producto", sortable: true },
    { key: null, label: "Extensión", sortable: false },
    { key: null, label: "Tipo", sortable: false, alignment: "center" },
    { key: "fecha", label: "Fecha", sortable: true },
    { key: null, label: "Estado", sortable: false },
    { key: null, label: "", sortable: false, className: "w-8" }
];

/**
 * Master Page for Managing Loans.
 * Includes bulk actions, filtering, and a modernized data table.
 */
export default function LoansPage() {
    const selectAllRef = useRef();

    const {
        isLoading, isError,
        busqueda, setBusqueda,
        filters, hasActiveFilters, handleFilterChange,
        prestamosFiltrados,
        sortConfig, setSortConfig
    } = useLoansData();

    // UI Selection State
    const [selectedLoans, setSelectedLoans] = useState(new Set());
    const { mutate: returnBulkLoans, isPending: isProcessing } = useBulkReturnLoansMutation();

    /**
     * Toggles sorting direction or switches the active sorting key.
     * * @param {string} key - The column key to sort by.
     */
    const handleSort = useCallback((key) => {
        setSortConfig((prev) => {
            const direction = prev.key === key && prev.direction === "asc" ? "desc" : "asc";
            return { key, direction };
        });
    }, [setSortConfig]);

    const returnableLoans = useMemo(() => {
        return prestamosFiltrados.filter(loan => !loan.finalizado);
    }, [prestamosFiltrados]);

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
    const handleBulkReturn = () => {
        if (selectedLoans.size === 0) return;
        if (selectedLoans.size > 2) {
            const isConfirmed = window.confirm(
                `¿Estás seguro de que deseas marcar los ${selectedLoans.size} préstamos seleccionados como devueltos?`
            );
            if (!isConfirmed) return;
        }

        // Fire the mutation and pass a callback to clear the selection ONLY on success
        returnBulkLoans(selectedLoans, {
            onSuccess: () => {
                setSelectedLoans(new Set());
            }
        });
    };

    /** Indeterminate trigger */
    useEffect(() => {
        if (selectAllRef.current)
            selectAllRef.current.indeterminate = selectedLoans.size > 0 && !isAllSelected;
    }, [isAllSelected, selectedLoans])

    return (
        <DataPageLayout
            title="Préstamos"
            headerActions={
                <>
                    <SearchBar
                        placeholder="Buscar por nombre, RUT, producto..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        wrapperClassName="w-full min-w-sm"
                    />
                    <FilterDropdown filters={filters} onFilterChange={handleFilterChange} hasActiveFilters={hasActiveFilters} />
                </>
            }
        >
            {/* Contextual Action Bar */}
            <AnimatePresence>
                {selectedLoans.size > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, y: 50 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: 50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed bottom-4 left-1/2 z-50 w-[50vw] max-w-4xl min-w-xl px-4"
                    >
                        <div className="bg-linear-to-b from-base-300/40 to-base-300 to-50% border border-base-content/20 rounded-box container w-full -translate-x-1/2 p-3 flex items-center justify-between">
                            <div className="flex text-sm items-center gap-2 px-2">
                                <span>
                                    {selectedLoans.size}{" "}
                                    producto{selectedLoans.size !== 1 ? 's' : ''}{" "}
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
                                    Devolver {selectedLoans.size !== 1 ? 'lote' : 'producto'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <QueryStateManager
                isLoading={isLoading}
                isEmpty={prestamosFiltrados.length === 0}
                isError={isError}
                hasFilters={hasActiveFilters}
                loadingSlot={<div className="flex flex-1 mask-b-from-0%">
                    <SkeletonTable rows={18} />
                </div>}
            >
                {/* Main Data Table */}
                <Table wrapperClassName="flex-1 grow min-h-0 scrollbar-gutter-stable" zebra>
                    <TableHeader className="bg-base-200 select-none">
                        <TableRow>
                            <TableHead pin className="w-8 text-center">
                                <Tooltip content="Seleccionar todo">
                                    <label>
                                        <input
                                            ref={selectAllRef}
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={isAllSelected}
                                            onChange={handleToggleAll}
                                            disabled={returnableLoans.length === 0}
                                        />
                                    </label>
                                </Tooltip>
                            </TableHead>

                            {TABLE_COLUMNS.map(({ key, label, sortable, alignment, className = "" }) => {
                                const isCurrentSort = sortConfig.key === key;
                                const headerClasses = sortable
                                    ? `cursor-pointer transition-colors text-base-content ${className}`
                                    : className;
                                const alignmentClasses = {
                                    "center": "text-center justify-center",
                                    "end": "text-right justify-end"
                                };

                                return (
                                    <TableHead
                                        key={label || key || "actions"}
                                        pin
                                        className={headerClasses}
                                        onClick={sortable ? () => handleSort(key) : undefined}
                                    >
                                        <Tooltip content={sortable ? `Ordenar por ${label.toLowerCase()}` : ""}>
                                            <div className={`flex items-center gap-1 ${alignmentClasses[alignment] ?? "text-left justify-start"}`}>
                                                {label}
                                                {sortable && isCurrentSort && (
                                                    <ArrowDownIcon
                                                        className={`size-5 bg-primary/50 text-base-content rounded-full p-px ml-1 transition-all ${sortConfig.direction === "asc" ? "rotate-180" : ""
                                                            }`}
                                                    />
                                                )}
                                            </div>
                                        </Tooltip>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <AnimatePresence>
                            {prestamosFiltrados.map((prestamo) => {
                                const isSelected = selectedLoans.has(prestamo._id);
                                const isFinalizado = prestamo.finalizado;

                                const { category: grupoProducto, name: nombreProducto } = parseProductString(prestamo.nombre_producto);

                                return (
                                    <TableRow
                                        key={prestamo._id}
                                        as={motion.tr}
                                        layout="position"
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                        transition={{
                                            layout: { type: "spring", stiffness: 300, damping: 30 }
                                        }}
                                        selected={isSelected}
                                        interactive={!isFinalizado}
                                        onTap={() => !isFinalizado && handleToggleSelection(prestamo._id)}
                                    >
                                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                            <Tooltip content="Seleccionar">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-sm"
                                                        checked={isSelected}
                                                        disabled={isFinalizado}
                                                    />
                                                </label>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap font-mono tracking-tight text-base-content/60">
                                            {formatRut(prestamo.rut)}
                                        </TableCell>
                                        <TableCell className="font-medium min-w-60">
                                            <div className="line-clamp-2 capitalize">
                                                {prestamo.nombre}
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-80">
                                            {(
                                                <a onClick={ev => { ev.stopPropagation(); }} className="font-mono truncate max-w-full w-fit block underline-offset-2 link link-hover text-primary saturate-40 brightness-125" href={`mailto:${prestamo.email}`}>
                                                    {prestamo.email}
                                                </a>
                                            ) || <EmptyRow />}
                                        </TableCell>
                                        <TableCell className="min-w-40 max-w-60 **:decoration-base-content/60">
                                            <div className="line-clamp-2">
                                                <Tooltip content={grupoProducto}>
                                                    <span className={grupoProducto.length ? "underline decoration-dotted hover:decoration-solid cursor-help" : ""}>{nombreProducto}</span>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono min-w-20 whitespace-nowrap tracking-wider">
                                            {prestamo.extension_codigo ? (
                                                <span>
                                                    {prestamo.extension_codigo
                                                        .replace(
                                                            prestamo.nombre_producto
                                                                .replace(/\(.*?\)/g, "").trim()
                                                                .replace(/^.*\s+-\s+/g, "")
                                                            , "")
                                                    }
                                                </span>
                                            ) : <EmptyRow />}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {renderLoanTypeBadge(prestamo.tipo_prestamo)}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap font-mono tracking-tighter **:decoration-base-content/60">
                                            <Tooltip content={new Date(getPrestamoDate(prestamo)).toLocaleString("es-CL", { hour12: false })}>
                                                <span className="underline decoration-dotted hover:decoration-solid cursor-help">
                                                    {formatTimestamp(getPrestamoDate(prestamo))}
                                                </span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <ReturnStatus prestamo={prestamo} />
                                        </TableCell>
                                        <TableCell className="text-center overflow-hidden">
                                            {prestamo.comentario?.replace(/^sin observaciones$/gi, "")?.trim() && (
                                                <Tooltip content={prestamo.comentario}>
                                                    <span className="cursor-help">
                                                        <CommentQuoteIcon className="size-5 scale-115" />
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </AnimatePresence>
                    </TableBody>
                </Table>
            </QueryStateManager>
        </DataPageLayout>
    );
}