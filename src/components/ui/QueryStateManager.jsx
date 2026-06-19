import { forwardRef } from "react";
import PropTypes from "prop-types";
import DataStateManager from "./DataStateManager";

/**
 * High-Level Adapter for TanStack Query lifecycle boolean flags.
 */
const QueryStateManager = forwardRef(({
    isLoading,
    isError,
    isEmpty,
    error,
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

    // Determine the unified abstract state based on query hooks boolean flags
    let computedState = "idle";

    if (isLoading) {
        computedState = "loading";
    } else if (isError) {
        computedState = "error";
    } else if (isEmpty) {
        computedState = "empty";
    } else {
        computedState = "success";
    }

    return (
        <DataStateManager
            ref={ref}
            state={computedState}
            error={error}
            hasFilters={hasFilters}
            onRetry={onRetry}
            onClearFilters={onClearFilters}
            loadingSlot={loadingSlot}
            errorSlot={errorSlot}
            emptySlot={emptySlot}
            emptyFiltersSlot={emptyFiltersSlot}
            {...props}
        >
            {children}
        </DataStateManager>
    );
});

QueryStateManager.displayName = "QueryStateManager";

QueryStateManager.propTypes = {
    /** True if the query is executing for the first time or fetching without cached records */
    isLoading: PropTypes.bool.isRequired,
    /** True if the query encountered a rejection or throw runtime exception */
    isError: PropTypes.bool.isRequired,
    /** The error object reference returned directly by TanStack Query */
    error: PropTypes.object,
    /** True if the data is empty */
    isEmpty: PropTypes.bool,
    /** Tells the manager if the user is currently applying external search filters */
    hasFilters: PropTypes.bool,
    /** Maps directly to TanStack Query 'refetch' function mechanism */
    onRetry: PropTypes.func,
    /** Callback handler routine executed to clear client search states */
    onClearFilters: PropTypes.func,
    loadingSlot: PropTypes.node,
    errorSlot: PropTypes.node,
    emptySlot: PropTypes.node,
    emptyFiltersSlot: PropTypes.node,
    children: PropTypes.node
};

export default QueryStateManager;