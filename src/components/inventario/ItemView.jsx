import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import EliminarItem from './EliminarItem';
import QRgenerator from './QRgenerator';
import SelectCategoria from './SelectCategoria';

import url from '../../utils';

export default function ItemView() {
    const navigate = useNavigate();

    const { id } = useParams();
    const [item, setItem] = useState(null);

    useEffect(() => {
        axios
            .get(url + `/inventario/${id}`)
            .then((res) => {
                setItem(res.data);
            })
            .catch((err) => {
                console.log(err);
            });
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setItem((prevItem) => ({
            ...prevItem,
            [name]: value,
        }));
    }

    const handleSave = () => {
        axios
           .put(url + `/inventario/${id}`, item)
           .then((res) => {
                console.log(res);
                navigate('/inventario');
            })
           .catch((err) => {
                console.log(err);
            });
    }

    if (!item) {
        return <p>Loading...</p>;
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-5 border rounded shadow-md">
            <h2 className="text-2xl font-bold mb-5">Editar Item</h2>
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nombre">Nombre</label>
                <input
                    type="text"
                    placeholder="Nombre"
                    name="nombre"
                    value={item.nombre}
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
                    value={item.descripcion}
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
                    value={item.precio}
                    onChange={handleChange}
                    className="input input-bordered w-full max-w-xs"
                />
            </div>
            <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="categoria">Categoría</label>
                <SelectCategoria
                    name="categoria"
                    value={item.categoria}
                    onChange={handleChange}
                    permitirNuevo={true}
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="stock">Stock</label>
                <input
                    type="text"
                    placeholder="Stock"
                    name="stock"
                    value={item.stock}
                    onChange={handleChange}
                    className="input input-bordered w-full max-w-xs"
                />
            </div>
            <button onClick={handleSave} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Guardar
            </button>
            <QRgenerator id={item._id} />
            <EliminarItem id={item._id} />
        </div>
    )
}

