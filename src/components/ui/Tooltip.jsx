import { useState, cloneElement, isValidElement } from "react";
import PropTypes from "prop-types";
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    useHover,
    useFocus,
    useDismiss,
    useRole,
    useInteractions,
    FloatingPortal,
} from "@floating-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { tv } from "tailwind-variants";

const tooltipStyles = tv({
    base: "z-1000 px-2 py-1 text-xs font-semibold rounded bg-neutral text-neutral-content border-neutral-content/20 border shadow-sm/50 pointer-events-none max-w-xs text-center leading-tight",
});

export default function Tooltip({ children, content, placement = "bottom", delay = 50 }) {
    const [isOpen, setIsOpen] = useState(false);

    // Core positioning and middleware calculation
    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement,
        // autoUpdate ensures the tooltip moves if the reference or viewport resizes/scrolls
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(6), // Distance from the trigger element
            flip({ fallbackAxisSideDirection: "start" }), // Flips if screen edges are hit
            shift({ padding: 8 }), // Prevents overflow on the X/Y axis
        ],
    });

    // Interaction bindings for accessibility and standard UX
    const hover = useHover(context, { move: false, delay: { open: delay, close: 0 } });
    const focus = useFocus(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: "tooltip" });

    const { getReferenceProps, getFloatingProps } = useInteractions([
        hover,
        focus,
        dismiss,
        role,
    ]);

    // Calculate a slight directional micro-animation based on placement
    const initialY = placement.startsWith("top") ? 5 : placement.startsWith("bottom") ? -5 : 0;
    const initialX = placement.startsWith("left") ? 5 : placement.startsWith("right") ? -5 : 0;

    return (
        <>
            {/* Transparently wrap the trigger element, or fallback to a span if it's text */}
            {isValidElement(children) ? (
                cloneElement(children, getReferenceProps({
                    ref: refs.setReference,
                    ...children.props,
                }))
            ) : (
                <span ref={refs.setReference} {...getReferenceProps()} className="cursor-help">
                    {children}
                </span>
            )}

            {/* Render the actual tooltip at the end of document.body to prevent clipping */}
            <FloatingPortal>
                <AnimatePresence>
                    {isOpen && content && (
                        <div
                            ref={refs.setFloating}
                            style={{ ...floatingStyles, zIndex: 1000 }}
                            {...getFloatingProps()}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: initialY, x: initialX }}
                                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className={tooltipStyles()}
                            >
                                {content}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </FloatingPortal>
        </>
    );
}

Tooltip.propTypes = {
    children: PropTypes.node.isRequired,
    content: PropTypes.node,
    placement: PropTypes.oneOf([
        "top", "top-start", "top-end",
        "bottom", "bottom-start", "bottom-end",
        "left", "left-start", "left-end",
        "right", "right-start", "right-end"
    ]),
    delay: PropTypes.number,
};