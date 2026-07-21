import PropTypes from "prop-types";

/**
 * Standardized layout wrapper for data-heavy pages (tables, grids).
 * Ensures consistent padding, dynamic height calculation, and responsive header structures.
 */
export default function DataPageLayout({ title, headerActions, topContent, children }) {
    return (
        <div className="container mx-auto p-4 flex flex-col h-full overflow-hidden gap-4 relative">
            {/* Standardized Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <h1 className="text-2xl font-bold">{title}</h1>

                {headerActions && (
                    <div className="flex flex-row max-lg:flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                        {headerActions}
                    </div>
                )}
            </header>

            {/* Optional Secondary Content (e.g., Alerts, Banners) */}
            {topContent && (
                <div className="flex flex-col gap-2 shrink-0">
                    {topContent}
                </div>
            )}

            {/* Main Content Area (Table Wrapper) */}
            <div className="bg-base-100 border border-base-content/20 rounded-box overflow-hidden flex flex-col flex-1 mb-8 relative">
                {children}
            </div>
        </div>
    );
}

DataPageLayout.propTypes = {
    title: PropTypes.string.isRequired,
    headerActions: PropTypes.node,
    topContent: PropTypes.node,
    children: PropTypes.node.isRequired,
};