import { useState, useEffect } from "react";
import axios from "axios";
import url from "../../utils";

export default function CategorySelector({ value, onChange, name, className }) {
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        axios
            .get(url + "/inventario/categorias")
            .then((res) => {
                setCategorias(res.data);
            })
            .catch((err) => {
                console.log(err);
            });
    }, []);

    return (
        <select
            name={name}
            className={className || "input input-bordered w-full max-w-xs"}
            value={value}
            onChange={onChange}
        >
            <option value="">Selecciona una categoría</option>
            {categorias.map((categoria, index) => (
                <option key={index} value={categoria}>
                    {categoria}
                </option>
            ))}
        </select>
    );
}
