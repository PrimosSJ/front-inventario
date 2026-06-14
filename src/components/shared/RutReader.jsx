import { useState } from "react";
import { extractRutFromInput } from "../../utils/rut.utils";

/**
 * RutReader component handles input collection and real-time sanitization 
 * for Chilean RUT identification numbers.
 * * @param {Object} props - Component props.
 * @param {Function} props.onRutChange - Callback function triggered when a valid RUT is parsed.
 */
export default function RutReader({ onRutChange, className: _className }) {
    const [inputText, setInputText] = useState("");

    /**
     * Validates and filters user input in real-time, removing any character
     * that does not belong to a standard Chilean RUT format.
     * * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
     */
    function handleInputChange(e) {
        const { value } = e.target;

        // Defensive programming: strip any character that is not a digit, dot, hyphen, or the letter 'k'/'K'
        const sanitizedValue = value.replace(/[^0-9kK.\-]/g, "");

        setInputText(sanitizedValue);

        const extractedRut = extractRutFromInput(sanitizedValue);
        if (extractedRut) {
            onRutChange(extractedRut);
        }
    }

    return (
        <label className={`form-control w-full ${_className}`}>
            <div className="label pb-1">
                <span className="label-text">RUT</span>
            </div>

            <label className="input input-bordered flex items-center w-full gap-2">
                <svg
                    className="h-4 w-4 opacity-70"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                    type="text"
                    className="grow w-full"
                    placeholder="12.345.678-9"
                    value={inputText}
                    onChange={handleInputChange}
                    maxLength="12"
                />
            </label>
        </label>
    );
}