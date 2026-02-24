import { useState, useEffect } from "react";
import axios from "axios";

import url from "../../utils";

export default function AgregarItem() {
    const [newItem, setNewItem] = useState({
        nombre: "",
        descripcion: "",
        precio: "",
        categoria: "",
        stock: "",
    });

    const [categorias, setCategorias] = useState([]);
    const listaCategorias = categorias.map(categoria => 
        <option value={categoria}>{categoria}</option>
    );

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewItem((prevItem) => ({
            ...prevItem,
            [name]: value,
        }));
    }

    const handleAddItem = () => {
        axios
            .post(url + "/inventario", newItem)
            .then((res) => {
                setNewItem({
                    nombre: "",
                    descripcion: "",
                    precio: "",
                    categoria: "",
                    stock: "",
                });
                console.log(res);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-5 border rounded shadow-md">
            <h2 className="text-2xl font-bold mb-5">Agregar Item</h2>
            
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">Nombre</label>
                <input 
                    type="text" 
                    placeholder="Nombre" 
                    name="nombre" 
                    value={newItem.nombre}
                    onChange={handleChange} 
                    className="input input-bordered w-full max-w-xs"
                />
            </div>
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descripcion">Descripción</label>
            <input 
                type="text" 
                placeholder="Descripción" 
                name="descripcion"
                value={newItem.descripcion}
                onChange={handleChange} 
                className="input input-bordered w-full max-w-xs"
            />
            </div>
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="precio">Precio</label>
            <input 
                type="text" 
                placeholder="Precio" 
                name="precio"
                value={newItem.precio}
                onChange={handleChange} 
                className="input input-bordered w-full max-w-xs"
            />
            </div>
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoria">Categoría</label>
                <select
                    name="categoria"
                    value={newItem.categoria}
                    onChange={handleChange}
                    className="input input-bordered w-full max-w-xs"
                >
                    <option value="">Selecciona una categoría</option>
                    {listaCategorias}
                </select>
            </div>

            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="stock">Stock</label>
            <input 
                type="text" 
                placeholder="Stock" 
                name="stock"
                value={newItem.stock}
                onChange={handleChange} 
                className="input input-bordered w-full max-w-xs"
            />
            </div>
            <button 
                onClick={handleAddItem}
                className="btn btn-xs sm:btn-md lg:btn-lg"
            >
                Agregar
            </button>

        </div>
    )
}
