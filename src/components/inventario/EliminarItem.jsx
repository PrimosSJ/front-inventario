import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../../utils';

export default function EliminarItem({ id }) {
    const navigate = useNavigate();
    const [confirmando, setConfirmando] = useState(false);

    const handleDeleteItem = () => {
        api
            .delete(`/inventario/${id}`)
            .then(() => {
                navigate("/inventario");
            })
            .catch((err) => {
                console.log(err);
                setConfirmando(false);
            });
    };

    if (!confirmando) {
        return (
            <div className="max-w-md mx-auto mt-10 p-5 border rounded shadow-md">
                <button
                    onClick={() => setConfirmando(true)}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                >
                    Eliminar
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-10 p-5 border rounded shadow-md bg-red-50">
            <p className="mb-3 font-semibold text-red-700">
                ¿Confirma la eliminación de este item? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
                <button
                    onClick={handleDeleteItem}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                    Sí, eliminar
                </button>
                <button
                    onClick={() => setConfirmando(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}
