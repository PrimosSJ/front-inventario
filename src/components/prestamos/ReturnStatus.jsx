import PropTypes from 'prop-types';
import { tv } from 'tailwind-variants';

import { formatTimestamp } from "../../utils/date.utils";

import Tooltip from "../ui/Tooltip";
import { ClockExclamationIcon } from "../icons"


/**
 * Tailwind Variants definition for the status badge.
 */
const badgeStyles = tv({
    base: "items-center rounded min-w-24 px-1 py-0.5 block text-center truncate shadow-sm/50 underline-offset-2 text-xs font-medium transition-colors",
    variants: {
        status: {
            completed: "bg-linear-to-b from-transparent to-success-content/60 border border-success text-success font-medium",
            pending: [
                "text-neutral-content border border-base-content/20 font-medium bg-base-100",
            ],
            overdue: "bg-error text-error-content font-bold",
            critical: [
                "bg-base-100 text-error border border-error/60 font-semibold",
                "bg-[linear-gradient(-45deg,--transparent(var(--color-error),20%)_25%,transparent_25%,transparent_50%,--transparent(var(--color-error),20%)_50%,--transparent(var(--color-error),20%)_75%,transparent_75%,transparent)] bg-size-[24px_24px]"
            ],
            warning: [
                "bg-base-100 text-warning border border-warning/30 font-semibold",
                "bg-[linear-gradient(-45deg,--transparent(var(--color-warning),20%)_25%,transparent_25%,transparent_50%,--transparent(var(--color-warning),20%)_50%,--transparent(var(--color-warning),20%)_75%,transparent_75%,transparent)] bg-size-[24px_24px]"
            ],
            safe: "bg-base-100 text-primary border border-primary/50",
        },
    },
    defaultVariants: {
        status: "pending",
    },
});

/**
 * Computes the remaining time details and maps them to design variants.
 * * @param {string} expectedReturnIso - ISO timestamp of the expected return date.
 * @returns {{ text: string | JSX.Element, status: string }} The UI text representation and the variant key.
 */
function getRemainingTimeDetails(expectedReturnIso) {
    const now = new Date();
    const target = new Date(expectedReturnIso);
    const diffMs = target.getTime() - now.getTime();
    const diffTotalHours = diffMs / (1000 * 60 * 60);
    const diffDays = Math.floor(diffTotalHours / 24);

    if (diffMs <= 0) {
        const overdueHours = Math.abs(Math.ceil(diffTotalHours));
        if (overdueHours < 24) {
            return { text: `Vencido hace ${overdueHours}h`, status: "overdue" };
        }
        const overdueDays = Math.ceil(Math.abs(diffTotalHours) / 24);
        return { text: `Vencido hace ${overdueDays} día${overdueDays !== 1 ? "s" : ""}`, status: "overdue" };
    }

    if (diffTotalHours < 24) {
        const remainingMinutes = Math.ceil(diffMs / (1000 * 60));
        const hours = Math.floor(remainingMinutes / 60);
        const minutes = remainingMinutes % 60;

        return {
            text: <>
                <ClockExclamationIcon />
                {hours > 0
                    ? `${hours}h ${minutes}m`
                    : `${minutes}m`}
            </>, status: "critical"
        };
    }

    if (diffDays <= 3) {
        const remainingHours = Math.floor(diffTotalHours % 24);
        return {
            text: <>
                <ClockExclamationIcon />
                {`${diffDays}d ${remainingHours}h`}
            </>, status: "warning"
        };
    }



    if (diffDays <= 31) {
        return { text: `${diffDays}d`, status: "safe" };
    }

    return { text: formatTimestamp(target), status: "safe" };
}

/**
 * Evaluates loan data to render a unified return status badge.
 * @returns {JSX.Element} The unified status badge component.
 */
export default function ReturnStatus({ prestamo }) {
    const { tipo_prestamo, fecha_devolucion_esperada, finalizado, updatedAt } = prestamo;

    // Structure a clean timeline display for tooltips
    const renderTimelineTooltip = (extraInfo = null) => (
        <div>
            {extraInfo}
        </div>
    );

    if (finalizado) {
        return (
            <Tooltip
                content={renderTimelineTooltip(
                    <div>
                        <p>
                            Producto devuelto.
                        </p>
                        <span className='text-base-content/60'>Devuelto:</span> {formatTimestamp(updatedAt)}
                    </div>
                )}
            >
                <span className={badgeStyles({ status: "completed", className: "cursor-help" })}>
                    Completado
                </span>
            </Tooltip>
        );
    }

    if (tipo_prestamo !== "especial" || !fecha_devolucion_esperada) {
        return (
            <Tooltip content={renderTimelineTooltip("A la espera de devolución.")}>
                <span className={badgeStyles({ status: "pending", className: "cursor-help" })}>
                    Pendiente
                </span>
            </Tooltip>
        );
    }

    const { text, status } = getRemainingTimeDetails(fecha_devolucion_esperada);
    const isOverdue = new Date(fecha_devolucion_esperada).getTime() <= Date.now();

    return (
        <Tooltip
            content={renderTimelineTooltip(
                <div>
                    <p>Fecha de devolución programada.</p>
                    <span className='text-base-content/60'>Plazo original:</span> {formatTimestamp(fecha_devolucion_esperada)}
                    {isOverdue && (
                        <p>
                            <span className="text-error font-semibold">Vencido</span>
                        </p>
                    )}
                </div>
            )}
        >
            <span className={badgeStyles({ status, className: "cursor-help *:inline [&_svg]:size-4 [&_svg]:scale-115 [&_svg]:mr-2 flex justify-center items-center" })}>
                {text}
            </span>
        </Tooltip>
    );
}

ReturnStatus.propTypes = {
    prestamo: PropTypes.shape({
        tipo_prestamo: PropTypes.string.isRequired,
        fecha_devolucion_esperada: PropTypes.string,
        finalizado: PropTypes.bool.isRequired,
        updatedAt: PropTypes.string,
    }).isRequired,
};