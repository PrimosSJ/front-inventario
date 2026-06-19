import { forwardRef } from "react";
import PropTypes from "prop-types";
import { tv } from "tailwind-variants";

/**
 * Tailwind Variants definition
 */
const searchBarStyles = tv({
    slots: {
        wrapper: [
            "flex flex-row items-center gap-2 px-3 h-9 min-h-9 rounded-sm border",
            "border-base-content/20 bg-base-100 text-base-content",
            "focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
            "transition-all duration-200"
        ],
        icon: "h-[1em] text-base-content/50 shrink-0",
        input: [
            "grow h-full bg-transparent text-sm! outline-none border-none p-0",
            "placeholder:text-base-content/40 focus:outline-none"
        ]
    }
});

const { wrapper, icon, input } = searchBarStyles();

/**
 * Reusable, decoupled SearchBar UI component
 */
const SearchBar = forwardRef(({
    value,
    onChange,
    placeholder = "Search...",
    className = "",
    wrapperClassName = "",
    ...props
}, ref) => {
    return (
        <label className={wrapper({ class: wrapperClassName })}>
            <svg
                className={icon()}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                </g>
            </svg>
            <input
                ref={ref}
                type="search"
                className={input({ class: className })}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                {...props}
            />
        </label>
    );
});

SearchBar.displayName = "SearchBar";

SearchBar.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    wrapperClassName: PropTypes.string,
};

export default SearchBar;