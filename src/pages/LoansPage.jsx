import { useMemo, useCallback } from "react";
import { useLoansData } from "../hooks/useLoans";
import { formatTimestamp, getPrestamoDate } from "../utils/date.utils";
import { formatRut } from "../utils/rut.utils";

import MarcarDevuelto from "../components/prestamos/DevolverPrestamo";
import TiempoRestante from "../components/prestamos/TiempoRestante";

import { StarIcon, PublicIcon } from "../components/icons";

/**
 * Renders the appropriate UI badge based on the loan type.
 * * @param {string} type - The loan type identifier.
 * @returns {JSX.Element} The badge element.
 */
function renderLoanTypeBadge(type) {
    const types = {
        "especial": {
            icon: StarIcon,
            className: "text-warning",
            text: "Especial"
        },
        "público": {
            icon: PublicIcon,
            className: "text-base-content/50",
            text: "Público"
        }
    }
    const { icon: Icon, className: _className, text } = types[type] ?? types["público"];

    return (<div className="tooltip tooltip-bottom" data-tip={text}>
        <Icon className={`size-5 ${_className}`} />
    </div>);
}

/**
 * Evaluates loan data to render the correct return status component or text.
 * Replaces complex nested ternaries from the main render cycle.
 * * @param {Object} loan - The individual loan record.
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
        <span className="text-sm text-gray-400">
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
    <span className="text-base-content/50 text-lg font-sans">
        —
    </span>
);

export default function Prestamos() {
    const {
        soloPendientes, setSoloPendientes,
        busqueda, setBusqueda,
        prestamosFiltrados, setPrestamos
    } = useLoansData();

    /**
     * Memoizes the sorted array to prevent unnecessary re-calculations on every render.
     * It only re-sorts when the underlying filtered loans array changes.
     */
    const sortedLoans = useMemo(() => {
        return [...prestamosFiltrados].sort((a, b) => {
            const dateA = new Date(getPrestamoDate(a)).getTime();
            const dateB = new Date(getPrestamoDate(b)).getTime();
            return dateB - dateA;
        });
    }, [prestamosFiltrados]);

    /**
     * Handles the state update when a loan is marked as returned.
     * Extracted from inline JSX to improve readability and memory allocation.
     */
    const handleLoanUpdate = useCallback((updatedLoan, currentLoanId) => {
        setPrestamos((prevLoans) =>
            prevLoans.map((loan) =>
                loan._id === (updatedLoan._id || currentLoanId)
                    ? { ...loan, ...updatedLoan, finalizado: true }
                    : loan
            )
        );
    }, [setPrestamos]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Préstamos</h1>

            <div className="bg-base-300 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por nombre, RUT, producto o email..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="input input-bordered w-full sm:max-w-md"
                    />
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-base-content">Pendientes</span>
                        <input
                            type="checkbox"
                            className="toggle toggle-primary"
                            checked={soloPendientes}
                            onChange={() => setSoloPendientes(!soloPendientes)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-hidden rounded-box border border-base-content/5 bg-base-100 min-h-full">
                    <table className="table table-zebra w-full ">
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
                            {sortedLoans.map((prestamo) => (
                                <tr key={prestamo._id}>
                                    <td className="whitespace-nowrap font-mono text-base-content/80">
                                        {formatRut(prestamo.rut)}
                                    </td>
                                    <td className="line-clamp-2 max-w-[300px]">{prestamo.nombre}</td>

                                    <td className="text-sm max-w-[224px] truncate" title={prestamo.email}>
                                        {prestamo.email || <Empty />}
                                    </td>
                                    <td className="line-clamp-2 max-w-[300px]">{prestamo.nombre_producto}</td>
                                    <td className="font-mono text-sm">
                                        {prestamo.extension_codigo || <Empty />}
                                    </td>
                                    <td>{renderLoanTypeBadge(prestamo.tipo_prestamo)}</td>
                                    <td>{formatTimestamp(getPrestamoDate(prestamo))}</td>
                                    <td>{renderReturnStatus(prestamo)}</td>
                                    <td>
                                        {prestamo.finalizado ? (
                                            <span className="badge badge-ghost">Devuelto</span>
                                        ) : (
                                            <MarcarDevuelto
                                                {...prestamo}
                                                onUpdate={(updated) => handleLoanUpdate(updated, prestamo._id)}
                                            />
                                        )}
                                    </td>
                                    <td className="text-center">
                                        {prestamo.comentario && (
                                            <div className="tooltip tooltip-left" data-tip={prestamo.comentario}>
                                                <InfoIcon />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}