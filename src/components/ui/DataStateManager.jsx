import { forwardRef } from "react";
import PropTypes from "prop-types";
import { tv } from "tailwind-variants";

const dataStateStyles = tv({
    slots: {
        container: "flex flex-col items-center justify-center min-h-[300px] w-full p-6 text-center animate-fade-in",
        title: "text-lg font-semibold text-base-content mt-4",
        description: "text-sm text-base-content/60 max-w-md mt-1 mb-6",
        iconWrapper: "text-base-content/40 p-4 bg-base-200/50 rounded-full"
    }
});

const { container, title, description, iconWrapper } = dataStateStyles();

/**
 * Default Loading State Representation.
 */
const DefaultLoading = () => (
    <div className={container()}>
        <span className="loading loading-spinner loading-lg text-primary" />
    </div>
);

/**
 * Default Error State Representation with automatic retry handling.
 */
const DefaultError = ({ error, onRetry }) => (
    <div className={container()}>
        <div className={iconWrapper()}>
            <svg className="size-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <h3 className={title()}>Error Loading Data</h3>
        <p className={description()}>{error?.message || "An unexpected network or client error occurred."}</p>
        {onRetry && (
            <button type="button" onClick={onRetry} className="btn btn-primary btn-sm normal-case font-medium">
                Try Again
            </button>
        )}
    </div>
);

/**
 * Default Empty State Representation (No items found in data source).
 */
const DefaultEmpty = () => (
    <div className={container()}>
        <div className={iconWrapper()}>
            <svg className="size-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-4.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293H10.12a1 1 0 01-.707-.293L7.00 13.293A1 1 0 006.293 13H2" />
            </svg>
        </div>
        <h3 className={title()}>No Records Found</h3>
        <p className={description()}>There is no data available to list in this section right now.</p>
    </div>
);

/**
 * Default Empty Filters State Representation (Results filtered out by active user queries).
 */
const DefaultEmptyFilters = ({ onClearFilters }) => (
    <div className={container()}>
        <div className={iconWrapper()}>
            <svg className="size-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
        <h3 className={title()}>No Matches Found</h3>
        <p className={description()}>Your active filters yielded 0 results. Try widening or updating your search parameters.</p>
        {onClearFilters && (
            <button type="button" onClick={onClearFilters} className="btn btn-outline btn-sm normal-case font-medium">
                Clear Active Filters
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