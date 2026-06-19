import { useState, createContext, useContext, cloneElement, isValidElement } from "react";
import PropTypes from "prop-types";
import {
    useFloating,
    autoUpdate,
    offset,
    flip,
    shift,
    useClick,
    useDismiss,
    useRole,
    useInteractions,
    FloatingPortal,
} from "@floating-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { tv } from "tailwind-variants";

/**
 * Enterprise-grade styles for the Menu components.
 */
const menuStyles = tv({
    slots: {
        content: "z-1000 min-w-3xs py-2 flex flex-col rounded-box bg-base-200 border border-base-content/10 shadow-md/50 outline-none origin-top",
        item: [
            "w-full flex items-center gap-2 px-4 py-1.5 cursor-pointer transition-colors text-sm outline-none hover:bg-base-content/10 focus:bg-base-content/10 disabled:opacity-50 disabled:cursor-not-allowed",
            "data-[active='true']:bg-base-content/10 data-[active='true']:before:content-['✓']"
        ],
        separator: "h-px w-full bg-base-content/10 my-1"
    }
});

const { content: contentStyle, item: itemStyle, separator: separatorStyle } = menuStyles();

/**
 * Internal context to share Floating UI state between Menu sub-components.
 */
const MenuContext = createContext(null);

const useMenuContext = () => {
    const context = useContext(MenuContext);
    if (!context) throw new Error("Menu components must be wrapped in <Menu />");
    return context;
};

/**
 * Root Menu Component.
 * Manages the internal state and positioning logic for the popover.
 */
export function Menu({ children, placement = "bottom-end", offsetValue = 8 }) {
    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        placement,
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(offsetValue),
            flip({ fallbackAxisSideDirection: "start" }),
            shift({ padding: 8 }),
        ],
    });

    const click = useClick(context);
    const dismiss = useDismiss(context);
    const role = useRole(context, { role: "menu" });

    const interactions = useInteractions([click, dismiss, role]);

    return (
        <MenuContext.Provider value={{ isOpen, setIsOpen, refs, floatingStyles, interactions }}>
            {children}
        </MenuContext.Provider>
    );
}

Menu.propTypes = {
    children: PropTypes.node.isRequired,
    placement: PropTypes.string,
    offsetValue: PropTypes.number,
};

/**
 * Wraps the trigger element (e.g., a Button).
 * Transparently merges refs and accessibility props.
 */
export function MenuTrigger({ children, asChild = true }) {
    const { refs, interactions } = useMenuContext();

    if (asChild && isValidElement(children)) {
        return cloneElement(children, interactions.getReferenceProps({
            ref: refs.setReference,
            ...children.props,
        }));
    }

    return (
        <div ref={refs.setReference} {...interactions.getReferenceProps()} className="inline-block">
            {children}
        </div>
    );
}

MenuTrigger.propTypes = {
    children: PropTypes.node.isRequired,
    asChild: PropTypes.bool,
};

/**
 * Renders the popover content securely at the root level using FloatingPortal.
 * Handles the Framer Motion enter/exit animations.
 */
export function MenuContent({ children, className }) {
    const { isOpen, refs, floatingStyles, interactions } = useMenuContext();

    return (
        <FloatingPortal>
            <AnimatePresence>
                {isOpen && (
                    <div
                        ref={refs.setFloating}
                        style={{ ...floatingStyles, zIndex: 1000 }}
                        {...interactions.getFloatingProps()}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10, transition: { duration: 0.15 } }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className={contentStyle({ class: className })}
                        >
                            {children}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </FloatingPortal>
    );
}

MenuContent.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
};

/**
 * An individual interactive action inside the Menu.
 * Automatically closes the menu on click unless configured otherwise.
 */
export function MenuItem({ children, onClick, disabled = false, closeOnClick = true, className, leftIcon, ...props }) {
    const { setIsOpen } = useMenuContext();

    const handleClick = (e) => {
        if (disabled) return;
        if (onClick) onClick(e);
        if (closeOnClick) setIsOpen(false);
    };

    return (
        <button
            type="button"
            role="menuitem"
            disabled={disabled}
            onClick={handleClick}
            className={itemStyle({ class: className })}
            {...props}
        >
            {leftIcon && <span className="shrink-0 size-4 *:size-4">{leftIcon}</span>}
            <span className="grow text-left">{children}</span>
        </button>
    );
}

MenuItem.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    closeOnClick: PropTypes.bool,
    className: PropTypes.string,
    leftIcon: PropTypes.node
};

/**
 * Optional structural separator for grouping items visually.
 */
export function MenuSeparator() {
    return <div role="separator" className={separatorStyle()} />;
}

export function MenuLabel({ children }) {
    return (
        <div className="select-none text-xs px-3 mb-1 mt-2 font-medium text-base-content/60 first:mt-0">
            {children}
        </div>
    );
}

MenuLabel.propTypes = {
    children: PropTypes.node.isRequired
};