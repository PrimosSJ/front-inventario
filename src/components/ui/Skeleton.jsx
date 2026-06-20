import { forwardRef } from "react";
import PropTypes from "prop-types";
import { tv } from "tailwind-variants";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./Table";

/**
 * Skeleton styles.
 */
const skeletonStyles = tv({
    base: [
        "select-none pointer-events-none",
        "block w-full z-0 bg-base-200/50 relative overflow-hidden",
        "bg-linear-to-r from-transparent via-base-content/10 to-55% to-transparent",
        "bg-size-[200%_100%] bg-fixed"
    ],
    variants: {
        shape: {
            rect: "rounded-md",
            circle: "rounded-full aspect-square",
            text: "rounded h-4",
        },
        shimmer: {
            true: "animate-shimmer",
            false: "bg-none!"
        }
    },
    defaultVariants: {
        shape: "rect",
        shimmer: true
    }
});

/**
 * Base Skeleton Component.
 * Used to build custom loading placeholders dynamically.
 */
export const Skeleton = forwardRef(({ shape, shimmer, className, ...props }, ref) => (
    <div
        ref={ref}
        aria-hidden="true"
        className={skeletonStyles({ shape, shimmer, class: className })}
        {...props}
    />
));

Skeleton.displayName = "Skeleton";
Skeleton.propTypes = {
    shape: PropTypes.oneOf(["rect", "circle", "text"]),
    shimmer: PropTypes.bool,
    className: PropTypes.string
};

/**
 * Pre-built Template: Multi-line text block.
 * Handles dynamic widths for the last line to look organic.
 */
export function SkeletonText({ lines = 3, className, gap = "gap-3", shimmer = true }) {
    return (
        <div className={`flex flex-col w-full ${gap} ${className || ""}`} aria-hidden="true">
            {Array.from({ length: lines }).map((_, index) => {
                // Make the last line naturally shorter (e.g., 66%) for visual realism
                const isLast = index === lines - 1;
                const widthClass = isLast && lines > 1 ? "w-2/3" : "w-full";

                return (
                    <Skeleton
                        key={index}
                        shape="text"
                        shimmer={shimmer}
                        className={widthClass}
                    />
                );
            })}
        </div>
    );
}

SkeletonText.propTypes = {
    lines: PropTypes.number,
    className: PropTypes.string,
    gap: PropTypes.string,
    shimmer: PropTypes.bool
};

/**
 * Pre-built Template: Avatar / Profile layout.
 * Couples a circular skeleton with a title/subtitle text skeleton structure.
 */
export function SkeletonProfile({ className, shimmer = true }) {
    return (
        <div className={`flex items-center gap-4 w-full max-w-sm ${className || ""}`} aria-hidden="true">
            <Skeleton shape="circle" shimmer={shimmer} className="w-12 shrink-0" />
            <div className="flex flex-col gap-2 grow">
                <Skeleton shape="text" shimmer={shimmer} className="h-4 w-3/4" />
                <Skeleton shape="text" shimmer={shimmer} className="h-3 w-1/2" />
            </div>
        </div>
    );
}

SkeletonProfile.propTypes = {
    className: PropTypes.string,
    shimmer: PropTypes.bool
};

/**
 * Pre-built Template: Data Table.
 * Seamlessly integrates with the existing internal Table components for structural consistency.
 */
export function SkeletonTable({ rows = 5, columns = 4, className, shimmer = true }) {
    return (
        <Table className={className} aria-hidden="true">
            <TableHeader>
                <TableRow>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <TableHead key={`th-${colIndex}`}>
                            <Skeleton shape="text" shimmer={shimmer} className="h-6 w-2/3" />
                        </TableHead>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <TableRow key={`tr-${rowIndex}`} interactive={false}>
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <TableCell key={`td-${rowIndex}-${colIndex}`}>
                                <Skeleton shape="text" shimmer={shimmer} className="h-6 w-full" />
                            </TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

SkeletonTable.propTypes = {
    rows: PropTypes.number,
    columns: PropTypes.number,
    className: PropTypes.string,
    shimmer: PropTypes.bool
};