import { forwardRef } from "react";
import PropTypes from "prop-types";
import { tv } from "tailwind-variants";

/**
 * Enterprise-grade Button component definition using tailwind-variants.
 * Maps flexible API props to DaisyUI core classes for maximum reusability.
 */
const buttonStyles = tv({
    base: [
        "relative inline-flex *:inline-flex gap-2 flex-row items-center justify-center font-medium transition-all duration-200 outline-none rounded border border-transparent select-none",
        "[&_svg]:size-4"
    ],
    variants: {
        color: {
            primary: "[--b:var(--color-primary)] [--t:var(--color-primary-content)] hover:brightness-110",
            neutral: "[--b:var(--color-neutral)] [--t:var(--color-neutral-content)] hover:brightness-110"
        },
        variant: {
            outline: "border-(--b) text-(--b) hover:border-(--t)/50",
            ghost: "text-(--t) hover:bg-(--t)/20"
        },
        size: {
            xs: "h-6 min-h-6 px-2 text-xs",
            sm: "h-8 min-h-8 px-3 text-sm",
            md: "h-9 min-h-9 px-4 text-sm",
            lg: "h-12 min-h-12 px-6 text-lg",
            icon: "h-8 min-h-8 text-xs [&_svg]:size-5"
        },
        layout: {
            block: "w-full flex",
            wide: "w-64",
            circle: "aspect-square rounded-full p-0 shrink-0",
            square: "aspect-square rounded p-1 shrink-0",
        },
        isLoading: {
            true: "pointer-events-none opacity-80",
        },
        disabled: {
            true: "opacity-50 cursor-not-allowed pointer-events-none grayscale-50",
        }
    },
    compoundVariants: [{
        variant: "outline",
        color: "neutral",
        className: "text-neutral-content"
    }],
    defaultVariants: {
        size: "md",
        color: "primary",
        layout: "block",
        variant: "outline"
    }
});

/**
 * Polymorphic Button Component.
 * Supports rendering as different HTML elements or custom components (e.g., React Router's <Link>).
 * Handles loading states, directional icons, and comprehensive styling variations securely.
 */
const Button = forwardRef(({
    as: Component = "button",
    color,
    size,
    variant,
    layout,
    isLoading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    className,
    children,
    type = "button",
    ...props
}, ref) => {

    // Fallback securely to 'button' type if rendering as a native button element
    const isNativeButton = Component === "button" || Component === "input";
    const buttonType = isNativeButton ? type : undefined;
    const isDisabled = disabled || isLoading;

    return (
        <Component
            ref={ref}
            type={buttonType}
            disabled={isNativeButton ? isDisabled : undefined}
            aria-disabled={isDisabled ? "true" : undefined}
            className={buttonStyles({
                color,
                size,
                variant,
                layout,
                isLoading,
                disabled,
                class: className
            })}
            {...props}
        >
            {/* Loading Spinner */}
            {isLoading && (
                <span className="loading loading-spinner loading-xs" aria-hidden="true" />
            )}

            {/* Leading Icon */}
            {!isLoading && leftIcon && (
                <span className="shrink-0 *:size-5" aria-hidden="true">{leftIcon}</span>
            )}

            {/* Core Content */}
            {children && <span>{children}</span>}

            {/* Trailing Icon */}
            {!isLoading && rightIcon && (
                <span className="shrink-0 *:size-5" aria-hidden="true">{rightIcon}</span>
            )}
        </Component>
    );
});

Button.displayName = "Button";

Button.propTypes = {
    /** The HTML element or React component to render as (e.g., 'a', Link, motion.button) */
    as: PropTypes.elementType,
    /** Base semantic color */
    color: PropTypes.oneOf([
        "primary", "secondary", "accent", "neutral",
        "info", "success", "warning", "error", "ghost", "link"
    ]),
    /** Button size scale */
    size: PropTypes.oneOf(["xs", "sm", "md", "lg"]),
    /** Visual style modifier */
    variant: PropTypes.oneOf(["outline", "soft", "dash"]),
    /** Structural layout constraint */
    layout: PropTypes.oneOf(["block", "wide", "circle", "square"]),
    /** Triggers the loading spinner and disables interactions */
    isLoading: PropTypes.bool,
    /** Standard disabled state */
    disabled: PropTypes.bool,
    /** Element to render before the children */
    leftIcon: PropTypes.node,
    /** Element to render after the children */
    rightIcon: PropTypes.node,
    /** Additional CSS classes to merge */
    className: PropTypes.string,
    /** Content to render inside the button */
    children: PropTypes.node,
    /** HTML button type attribute */
    type: PropTypes.oneOf(["button", "submit", "reset"]),
};

export default Button;