import { useState } from "react";

export default function RutReader({ onRutChange }) {
    const [rut, setRut] = useState("");
    const [inputText, setInputText] = useState("");

    function handleInputChange(e) {
        const { value } = e.target
        setInputText(value)

        const extractedRut = extractRutFromInput(value)
        if (extractedRut) {
            setRut(extractedRut)
            onRutChange(extractedRut)
        }
    }

    function extractRutFromInput(input) {
        const runMatch = input.match(/RUN¿([\d']+)/)
        if (runMatch && runMatch[1]){
            return runMatch[1].replace("'", '').slice(0, 8)
        }

        if (input.length === 18 && !isNaN(input)) {
            return input.slice(-8)
        }
    
    return input
    }

    return (
        <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rut">RUT</label>
            <input
                type="text"
                placeholder="Ingrese el rut"
                className="input input-bordered w-full max-w-xs"
                value={inputText}
                onChange={handleInputChange}
            />
        </div>
    )
}