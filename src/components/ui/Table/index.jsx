import { forwardRef } from "react";
import PropTypes from "prop-types";
import { tv } from "tailwind-variants";

/**
 * Enterprise-grade custom Table component built with tailwind-variants.
 * Completely replaces the reliance on global UI library classes.
 */
const tableStyles = tv({
    slots: {
        wrapper: "relative w-full overflow-auto",
        table: "w-full text-sm text-left border-collapse",
        header: "text-base-content/60 border-b border-base-content/20",
        body: "",
        row: "border-b border-base-content/5 transition-colors duration-100 outline-none",
        head: "py-3 px-3 first:pl-4 last:pr-4 align-middle font-semibold whitespace-nowrap transition-all",
        cell: "py-3 px-3 first:pl-4 last:pr-4 align-middle",
    },
    variants: {
        zebra: {
            true: { table: "[&_tbody_tr:nth-child(even)]:bg-base-200/30" }
        },
        pin: {
            true: { head: "sticky top-0 z-10 bg-base-200" }
        },
        interactive: {
            true: {
                row: "hover:bg-base-200/80! cursor-pointer",
                head: "hover:bg-white/20 cursor-pointer"
            }
        },
        selected: {
            true: { row: "bg-primary/10! hover:bg-primary/20!" }
        }
    }
});

const { wrapper, table, header, body, row, head, cell } = tableStyles();

/**
 * Root container for the Table component.
 * Manages external layout structure and delegates native table props.
 */
export const Table = forwardRef(({ className, wrapperClassName, zebra, ...props }, ref) => (
    <div className={wrapper({ class: wrapperClassName })}>
        <table ref={ref} className={table({ zebra, class: className })} {...props} />
    </div>
));
Table.displayName = "Table";
Table.propTypes = {
    className: PropTypes.string,
    wrapperClassName: PropTypes.string,
    zebra: PropTypes.bool
};

/**
 * Table header group (thead).
 */
export const TableHeader = forwardRef(({ className, ...props }, ref) => (
    <thead ref={ref} className={header({ class: className })} {...props} />
));
TableHeader.displayName = "TableHeader";
TableHeader.propTypes = { className: PropTypes.string };

/**
 * Table body group (tbody).
 */
export const TableBody = forwardRef(({ className, ...props }, ref) => (
    <tbody ref={ref} className={body({ class: className })} {...props} />
));
TableBody.displayName = "TableBody";
TableBody.propTypes = { className: PropTypes.string };

/**
 * Table row (tr). Supports a polymorphic 'as' prop allowing it to safely 
 * render animated variants like framer-motion's <motion.tr>.
 */
export const TableRow = forwardRef(({ className, as: Component = "tr", interactive, selected, ...props }, ref) => (
    <Component ref={ref} className={row({ interactive, selected, class: className })} {...props} />
));
TableRow.displayName = "TableRow";
TableRow.propTypes = {
    className: PropTypes.string,
    as: PropTypes.elementType,
    interactive: PropTypes.bool,
    selected: PropTypes.bool
};

/**
 * Table header cell (th). 
 * Pass `pin` to make the header sticky (replaces table-pin-rows).
 */
export const TableHead = forwardRef(({ className, pin, interactive, ...props }, ref) => (
    <th ref={ref} className={head({ pin, interactive, class: className })} {...props} />
));
TableHead.displayName = "TableHead";
TableHead.propTypes = { className: PropTypes.string, pin: PropTypes.bool, interactive: PropTypes.bool };

/**
 * Standard table data cell (td).
 */
export const TableCell = forwardRef(({ className, ...props }, ref) => (
    <td ref={ref} className={cell({ class: className })} {...props} />
));
TableCell.displayName = "TableCell";
TableCell.propTypes = { className: PropTypes.string };