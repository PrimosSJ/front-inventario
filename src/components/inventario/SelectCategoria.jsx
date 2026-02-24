import { useState, useEffect } from "react";
import axios from "axios";
import url from "../../utils";

export default function SelectCategoria({ value, onChange, name, className, permitirNuevo=false }) {
    const [categorias, setCategorias] = useState([]);
    const [nuevo, setNuevo] = useState(false);

    useEffect(() => {
        axios
            .get(url + "/inventario/categorias")
            .then((res) => {
                const categoriasCargadas = res.data;
                setCategorias(res.data);

                if (value && !categoriasCargadas.includes(value)) {
                    setNuevo(true);
                }
            })
            .catch((err) => {
                console.log(err);
            });
    }, []);

    const handleSelectChange = (e) => {
        const selectedValue = e.target.value;

        if (selectedValue === "__NUEVO__") {
            setNuevo(true);
            onChange({ target: { name: name, value: "" } });
        } else {
            setNuevo(false);
            onChange(e);
        }
    };

    return (
        <div>
            <select
                name={name}
                className={className || "input input-bordered w-full max-w-xs"}
                value={nuevo ? "__NUEVO__" : value}
                onChange={handleSelectChange}
            >
                <option value="">Selecciona una categoría</option>

                {categorias.map((categoria, index) => (
                    <option key={index} value={categoria}>
                        {categoria}
                    </option>
                ))}

                {permitirNuevo && (
                    <option value="__NUEVO__" className="font-bold">
                        + Nueva Categoría
                    </option>
                )}
            </select>

            {permitirNuevo && nuevo && (
                <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder="Nueva categoría..."
                    className="input input-bordered w-full max-w-xs mt-2"
                    autoFocus
                />
            )}
        </div>
    );
}
