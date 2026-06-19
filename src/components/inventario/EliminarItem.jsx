import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { deleteInventoryItemRequest } from '../../api/inventory.api';

/**
 * Component to handle item deletion with a confirmation state.
 */
export default function EliminarItem({ id, onSuccess }) {
    const navigate = useNavigate();
    const [confirmando, setConfirmando] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleDeleteItem = () => {
        setLoading(true);
        deleteInventoryItemRequest(id)
            .then(() => {
                if (onSuccess) {
                    onSuccess();
                } else {
                    navigate("/inventario");
                }
            })
            .catch((err) => {
                console.error(err);
                setConfirmando(false);
                setLoading(false);
            });
    };

    if (!confirmando) {
        return (
            <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="btn btn-error btn-outline"
            >
                Eliminar Item
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-error/10 p-2 rounded border border-error/30">
            <span className="text-xs font-semibold text-error">¿Eliminar definitivamente?</span>
            <button
                type="button"
                onClick={handleDeleteItem}
                disabled={loading}
                className="btn btn-error btn-sm"
            >
                {loading ? "..." : "Sí"}
            </button>
            <button
                type="button"
                onClick={() => setConfirmando(false)}
                disabled={loading}
                className="btn btn-ghost btn-sm"
            >
                No
            </button>
        </div>
    );
}

EliminarItem.propTypes = {
    id: PropTypes.string.isRequired,
    onSuccess: PropTypes.func
};