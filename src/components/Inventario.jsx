import { useEffect, useState } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Link } from "react-router-dom";

import SelectCategoria from "./inventario/SelectCategoria";

import url from "../utils";

const socket = io(url);

export default function Inventario() {
    const [inventory, setInventory] = useState([]);

    const [nombreFiltro, setNombreFiltro] = useState("");
    const [categoriaFiltro, setCategoriaFiltro] = useState("");

    const filteredInventory = (inventory || []).filter((item) => {
        const nombreMatch = item.nombre.toLowerCase().includes(nombreFiltro.toLowerCase());
        const categoriaMatch = categoriaFiltro === "" || item.categoria === categoriaFiltro;
        return nombreMatch && categoriaMatch;
    });

    useEffect(() => {
        axios
            .get(url + "/inventario")
            .then((res) => {
                setInventory(res.data);
            })
            .catch((err) => {
                console.log(err);
            });

        socket.on("inventoryUpdate", (data) => {
            setInventory(data);
            console.log(data);
        });

        return () => {
            socket.off("inventoryUpdate");
        };
    }, []);

    return (
        <>
            {inventory && (
                <div className="container mx-auto p-4">
                    <h1 className="text-3xl font-bold mb-6 text-center">Inventario</h1>
                    <div className="mb-4">
                        <div className="flex space-x-4">
                            <input
                                type="text"
                                placeholder="Buscar por nombre"
                                className="input input-bordered w-full max-w-xs"
                                value={nombreFiltro}
                                onChange={(e) => setNombreFiltro(e.target.value)}
                            />
                            <SelectCategoria
                                value={categoriaFiltro}
                                onChange={(e) => setCategoriaFiltro(e.target.value)}
                                className="select select-bordered w-full max-w-xs"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end mb-4">
                        <a href="/inventario/agregar" className="btn btn-primary">
                            Agregar Item
                        </a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra w-full">
                            <thead>
                                <tr>
                                    <th className="text-left">Nombre</th>
                                    <th className="text-left">ID</th>
                                    <th className="text-left">Descripción</th>
                                    <th className="text-left">Precio</th>
                                    <th className="text-left">Categoría</th>
                                    <th className="text-left">Stock</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInventory.map((item) => (
                                    <tr key={item._id}>
                                        <td>{item.nombre}</td>
                                        <td>{item._id}</td>
                                        <td>{item.descripcion}</td>
                                        <td>{item.precio}</td>
                                        <td>{item.categoria}</td>
                                        <td>{item.stock}</td>
                                        <td className="text-center">
                                            <Link
                                                to={`/inventario/${item._id}`}
                                                className="btn btn-primary btn-sm"
                                            >
                                                Editar
                                            </Link>
                                            <Link
                                                to={`/new_prestamo/${item._id}`}
                                                className="btn btn-warning btn-sm"
                                            >
                                                Prestar
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
    )
}
