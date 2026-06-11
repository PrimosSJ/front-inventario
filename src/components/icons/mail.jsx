const SVGComponent = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        {...props}
    >
        <g
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth={2.5}
            fill="none"
            stroke="currentColor"
        >
            <rect width={20} height={16} x={2} y={4} rx={2} />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </g>
    </svg>
);
export default SVGComponent;