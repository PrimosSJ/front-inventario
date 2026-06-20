import { forwardRef } from "react";
import PropTypes from "prop-types";
import { tv } from "tailwind-variants";

const dataStateStyles = tv({
    slots: {
        container: "flex flex-col gap-2 items-center justify-center min-h-75 h-full flex-1 w-full p-6 text-center animate-fade-in",
        title: "text-lg font-semibold text-base-content not-first:mt-4",
        description: "text-sm text-base-content/60 max-w-md not-last:mb-6",
        iconWrapper: "text-base-content/40 p-4 bg-base-200/50 rounded-full"
    }
});

const { container, title, description, iconWrapper } = dataStateStyles();

/**
 * Default Loading State Representation.
 */
const DefaultLoading = () => (
    <div className={container()}>
        <span className="loading loading-spinner loading-xl text-primary" />
    </div>
);

/**
 * Default Error State Representation with automatic retry handling.
 */
const DefaultError = ({ error, onRetry }) => (
    <div className={container()}>
        <h3 className={title()}>Error al cargar</h3>
        <p className={description()}>{error?.message || "Ha ocurrido un error inesperado."}</p>
        {onRetry && (
            <button type="button" onClick={onRetry} className="btn btn-primary btn-sm normal-case font-medium">
                Intentar de nuevo
            </button>
        )}
    </div>
);

/**
 * Default Empty State Representation (No items found in data source).
 */
export const DefaultEmpty = ({ title: titleContent, description: descriptionContent }) => (
    <div className={container()}>
        <h3 className={title()}>{titleContent || "No hay registros"}</h3>
        <p className={description()}>{descriptionContent || "No hay ningún registro en la base de datos."}</p>
    </div>
);

DefaultEmpty.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string
};

/**
 * Default Empty Filters State Representation (Results filtered out by active user queries).
 */
const DefaultEmptyFilters = ({ onClearFilters }) => (
    <div className={container()}>
        <h3 className={title()}>No hay resultados</h3>
        <p className={description()}>No hubieron resultados para los filtros activos.</p>
        {onClearFilters && (
            <button type="button" onClick={onClearFilters} className="btn btn-outline btn-sm normal-case font-medium">
                Limpiar filtros
            </button>
        )}
    </div>
);

/**
 * Enterprise Data State Manager.
 * Handles loading, error, empty, filtered-empty, and success states securely.
 */
const DataStateManager = forwardRef(({
    state,
    error = null,
    hasFilters = false,
    onRetry,
    onClearFilters,
    loadingSlot,
    errorSlot,
    emptySlot,
    emptyFiltersSlot,
    children,
    ...props
}, ref) => {

    // Explicit, fail-fast evaluation branch strategy
    switch (state) {
        case "loading":
            return loadingSlot || <DefaultLoading />;

        case "error":
            return errorSlot || <DefaultError error={error} onRetry={onRetry} />;

        case "empty":
            if (hasFilters) {
                return emptyFiltersSlot || <DefaultEmptyFilters onClearFilters={onClearFilters} />;
            }
            return emptySlot || <DefaultEmpty />;

        case "success":
        case "idle":
        default:
            return <div ref={ref} {...props}>{children}</div>;
    }
});

DataStateManager.displayName = "DataStateManager";

DataStateManager.propTypes = {
    /** Explicit lifecycle context state of the data source */
    state: PropTypes.oneOf(["idle", "loading", "error", "empty", "success"]).isRequired,
    /** Error payload containing diagnostic metrics or consumer-facing messages */
    error: PropTypes.any,
    /** Signifies whether search queries, sorting matrices, or filters are actively altering dataset output */
    hasFilters: PropTypes.bool,
    /** Interception callback routine executed during an error recovery action trigger */
    onRetry: PropTypes.func,
    /** Interception callback routine executed to clear mutated parameters during filtered-empty layouts */
    onClearFilters: PropTypes.func,
    /** Custom React node slot to override the default loader component completely */
    loadingSlot: PropTypes.node,
    /** Custom React node slot to override the default error component layout layout */
    errorSlot: PropTypes.node,
    /** Custom React node slot to override the standard baseline empty data template */
    emptySlot: PropTypes.node,
    /** Custom React node slot to override the empty search results template view */
    emptyFiltersSlot: PropTypes.node,
    /** Content rendered inside successful state scenarios */
    children: PropTypes.node
};

export default DataStateManager;