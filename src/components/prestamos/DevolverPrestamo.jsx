import axios from "axios";

import url from "../../utils";

export default function MarcarDevuelto(props) {
    const { _id, finalizado, onUpdate } = props;

    const handleClick = (e) => {
        e.preventDefault();
        axios
           .patch(url + `/prestamos/return/${_id}`)
           .then((res) => {
                // Si el backend devuelve el préstamo actualizado, usarlo; si no, aplicar un cambio optimista
                const updated = res.data && res.data._id ? res.data : { _id, finalizado: true };
                if (typeof onUpdate === 'function') onUpdate(updated);
            })
           .catch((err) => {
                console.log(err);
            });
    };

    return (
            <>
                <button 
                    onClick={handleClick}
                    disabled={finalizado}    
                    className={`btn btn-sm ${finalizado ? 'btn-disabled' : 'btn-primary'}`}
                >
                    Marcar Devuelto
                </button>
            </>
    )
}